import asyncio
import contextlib
import logging
import os
import sqlite3
import time
from collections import defaultdict, deque
from pathlib import Path
from statistics import mean, pstdev

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("flood_receiver")

app = FastAPI(title="AEGIS Flood Receiver")

# Configurable knobs to match different ML-side APIs.
ML_THREAT_URL = os.getenv("AEGIS_ML_THREAT_URL", "http://10.251.3.195:8000/api/telemetry/ingest")
RATE_WINDOW_SECONDS = int(os.getenv("AEGIS_FLOOD_WINDOW_SECONDS", "50"))
BURST_IDLE_SECONDS = float(os.getenv("AEGIS_BURST_IDLE_SECONDS", "1.0"))
TARGET_SYSTEM_NAME = os.getenv("AEGIS_FLOOD_TARGET_NAME", "Public Receiver :80")
RECEIVER_PORT = int(os.getenv("AEGIS_FLOOD_RECEIVER_PORT", "8001"))
ML_TIMEOUT_SECONDS = float(os.getenv("AEGIS_ML_TIMEOUT_SECONDS", "5"))
ML_RETRY_ATTEMPTS = int(os.getenv("AEGIS_ML_RETRY_ATTEMPTS", "3"))
ML_RETRY_BASE_DELAY_SECONDS = float(os.getenv("AEGIS_ML_RETRY_BASE_DELAY_SECONDS", "0.5"))
SENDER_WORKERS = int(os.getenv("AEGIS_ML_SENDER_WORKERS", "2"))
OUTBOUND_QUEUE_MAXSIZE = int(os.getenv("AEGIS_OUTBOUND_QUEUE_MAXSIZE", "10000"))
VALID_BEARER_TOKEN = os.getenv("AEGIS_VALID_BEARER_TOKEN", "receiver-valid-token")
HONEYTOKEN_BEARER_TOKENS_FALLBACK = os.getenv("AEGIS_HONEYTOKEN_BEARER_TOKENS", "receiver-honeytoken-trap")
DATABASE_URL = os.getenv("AEGIS_DATABASE_URL", "sqlite:///./aegis.db")

# Per-IP request history and alert cooldown tracking.
# RETAINED_HISTORY keeps all observed packets for full-flow feature aggregation.
# WINDOW_HISTORY is trimmed for window-based threshold checks only.
RETAINED_HISTORY: dict[str, deque[tuple[float, int, int]]] = defaultdict(deque)
WINDOW_HISTORY: dict[str, deque[tuple[float, int, int]]] = defaultdict(deque)
BURST_HISTORY: dict[str, deque[tuple[float, int, int]]] = defaultdict(deque)
TOTAL_REQUESTS_BY_IP: dict[str, int] = defaultdict(int)
SENT_COUNT_BY_IP: dict[str, int] = defaultdict(int)
LAST_PACKET_AT_BY_IP: dict[str, float] = {}
LAST_DEST_PORT_BY_IP: dict[str, int] = defaultdict(lambda: 80)
ENQUEUED_COUNT_BY_IP: dict[str, int] = defaultdict(int)
FAILED_COUNT_BY_IP: dict[str, int] = defaultdict(int)
DROPPED_COUNT_BY_IP: dict[str, int] = defaultdict(int)

GLOBAL_BLOCKLIST_PATH = Path("storage") / "firewall_blocklist.txt"
GLOBAL_BLOCKLIST_PATH.parent.mkdir(parents=True, exist_ok=True)
GLOBAL_BLOCKLIST_PATH.touch(exist_ok=True)
BLOCKED_IPS_CACHE: set[str] = set()
BLOCKLIST_MTIME: float = 0.0
HONEYTOKEN_DB_CACHE: set[str] = set()
HONEYTOKEN_DB_MTIME: float = 0.0

OUTBOUND_QUEUE: asyncio.Queue[dict] = asyncio.Queue(maxsize=OUTBOUND_QUEUE_MAXSIZE)


def parse_honeytoken_tokens(raw: str) -> set[str]:
    # Format: "token1,token2,token3"
    tokens: set[str] = set()
    for chunk in raw.split(","):
        item = chunk.strip()
        if not item:
            continue
        tokens.add(item)
    return tokens


HONEYTOKEN_TOKEN_FALLBACK_SET = parse_honeytoken_tokens(HONEYTOKEN_BEARER_TOKENS_FALLBACK)


def sqlite_db_path_from_url(database_url: str) -> Path:
    if database_url.startswith("sqlite:///"):
        raw = database_url.replace("sqlite:///", "", 1)
        return Path(raw)
    return Path("aegis.db")


HONEYTOKEN_DB_PATH = sqlite_db_path_from_url(DATABASE_URL)


def load_honeytoken_tokens_from_db() -> set[str]:
    global HONEYTOKEN_DB_CACHE, HONEYTOKEN_DB_MTIME

    if not HONEYTOKEN_DB_PATH.exists():
        return HONEYTOKEN_TOKEN_FALLBACK_SET

    try:
        mtime = HONEYTOKEN_DB_PATH.stat().st_mtime
    except FileNotFoundError:
        return HONEYTOKEN_TOKEN_FALLBACK_SET

    if mtime == HONEYTOKEN_DB_MTIME and HONEYTOKEN_DB_CACHE:
        return HONEYTOKEN_DB_CACHE

    try:
        with sqlite3.connect(HONEYTOKEN_DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT token_value FROM honeytokens WHERE status != 'deactivated'")
            rows = cursor.fetchall()
            HONEYTOKEN_DB_CACHE = {str(row[0]).strip() for row in rows if row and row[0]}
            HONEYTOKEN_DB_MTIME = mtime
            if HONEYTOKEN_DB_CACHE:
                return HONEYTOKEN_DB_CACHE
    except Exception as exc:
        logger.warning("Could not load honeytokens from DB (%s): %s", HONEYTOKEN_DB_PATH, exc)

    return HONEYTOKEN_TOKEN_FALLBACK_SET


def refresh_blocked_ips_cache() -> set[str]:
    global BLOCKLIST_MTIME, BLOCKED_IPS_CACHE
    try:
        mtime = GLOBAL_BLOCKLIST_PATH.stat().st_mtime
    except FileNotFoundError:
        return set()

    if mtime == BLOCKLIST_MTIME:
        return BLOCKED_IPS_CACHE

    BLOCKLIST_MTIME = mtime
    with GLOBAL_BLOCKLIST_PATH.open("r") as blocklist_file:
        BLOCKED_IPS_CACHE = {line.strip() for line in blocklist_file if line.strip()}
    return BLOCKED_IPS_CACHE


def append_ip_to_global_blocklist(ip: str) -> None:
    blocked = refresh_blocked_ips_cache()
    if ip in blocked:
        return

    # Ensure the new IP starts on a fresh line even if the file was manually edited
    # without a trailing newline.
    needs_separator = False
    if GLOBAL_BLOCKLIST_PATH.exists() and GLOBAL_BLOCKLIST_PATH.stat().st_size > 0:
        with GLOBAL_BLOCKLIST_PATH.open("rb") as blocklist_file:
            blocklist_file.seek(-1, 2)
            needs_separator = blocklist_file.read(1) != b"\n"

    with GLOBAL_BLOCKLIST_PATH.open("a") as blocklist_file:
        if needs_separator:
            blocklist_file.write("\n")
        blocklist_file.write(f"{ip}\n")
    refresh_blocked_ips_cache()


def remove_ip_from_global_blocklist(ip: str) -> None:
    blocked = refresh_blocked_ips_cache()
    if ip not in blocked:
        return
    remaining = [entry for entry in blocked if entry != ip]
    with GLOBAL_BLOCKLIST_PATH.open("w") as blocklist_file:
        for entry in sorted(remaining):
            blocklist_file.write(f"{entry}\n")
    refresh_blocked_ips_cache()


def _normalize_ml_url(url: str) -> str:
    if url.startswith("http://") or url.startswith("https://"):
        return url
    return f"http://{url}"


async def send_threat_to_ml(source_ip: str, target_system: str, features: dict) -> None:
    ml_url = _normalize_ml_url(ML_THREAT_URL)
    payload = {
        "source_ip": source_ip,
        "target_system": target_system,
        "features": features,
    }
    async with httpx.AsyncClient(timeout=ML_TIMEOUT_SECONDS) as client:
        for attempt in range(1, ML_RETRY_ATTEMPTS + 1):
            try:
                response = await client.post(ml_url, json=payload)
                if response.status_code < 400:
                    SENT_COUNT_BY_IP[source_ip] += 1
                    logger.info(
                        "Threat forwarded ip=%s endpoint=%s status=%s attempt=%s",
                        source_ip,
                        ml_url,
                        response.status_code,
                        attempt,
                    )
                    return

                # 4xx means payload/route issue; retry only for 5xx.
                if response.status_code < 500:
                    FAILED_COUNT_BY_IP[source_ip] += 1
                    logger.error(
                        "ML endpoint rejected payload ip=%s status=%s body=%s",
                        source_ip,
                        response.status_code,
                        response.text,
                    )
                    return

                logger.warning(
                    "ML endpoint temporary failure ip=%s status=%s attempt=%s",
                    source_ip,
                    response.status_code,
                    attempt,
                )
            except Exception as exc:
                logger.warning("ML send error ip=%s attempt=%s err=%s", source_ip, attempt, exc)

            if attempt < ML_RETRY_ATTEMPTS:
                await asyncio.sleep(ML_RETRY_BASE_DELAY_SECONDS * attempt)

    FAILED_COUNT_BY_IP[source_ip] += 1
    logger.error("Dropping payload after retries ip=%s endpoint=%s", source_ip, ml_url)


def enqueue_telemetry(source_ip: str, target_system: str, features: dict) -> None:
    job = {
        "source_ip": source_ip,
        "target_system": target_system,
        "features": features,
        "enqueued_at": time.time(),
    }
    try:
        OUTBOUND_QUEUE.put_nowait(job)
        ENQUEUED_COUNT_BY_IP[source_ip] += 1
    except asyncio.QueueFull:
        DROPPED_COUNT_BY_IP[source_ip] += 1
        logger.error("Outbound queue full; dropping telemetry ip=%s", source_ip)


async def outbound_sender_worker(worker_id: int) -> None:
    while True:
        job = await OUTBOUND_QUEUE.get()
        try:
            await send_threat_to_ml(job["source_ip"], job["target_system"], job["features"])
        finally:
            OUTBOUND_QUEUE.task_done()


def _request_size_bytes(request: Request) -> int:
    # Approximate request bytes from line + headers for GET flood telemetry.
    line_size = len(request.method) + len(request.url.path) + len(request.url.query)
    header_size = sum(len(k) + len(v) for k, v in request.headers.items())
    return line_size + header_size


def _response_size_bytes(status_code: int) -> int:
    # Fixed estimate for small JSON response body in this receiver.
    return 64 if status_code < 400 else 96


def _std(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    return float(pstdev(values))


def _mean(values: list[float]) -> float:
    if not values:
        return 0.0
    return float(mean(values))


def record_request(source_ip: str, now: float, req_bytes: int, resp_bytes: int, destination_port: int) -> int:
    RETAINED_HISTORY[source_ip].append((now, req_bytes, resp_bytes))
    history = WINDOW_HISTORY[source_ip]
    history.append((now, req_bytes, resp_bytes))
    BURST_HISTORY[source_ip].append((now, req_bytes, resp_bytes))
    TOTAL_REQUESTS_BY_IP[source_ip] += 1
    LAST_PACKET_AT_BY_IP[source_ip] = now
    LAST_DEST_PORT_BY_IP[source_ip] = destination_port

    while history and now - history[0][0] > RATE_WINDOW_SECONDS:
        history.popleft()

    return TOTAL_REQUESTS_BY_IP[source_ip]


def build_ml_feature_row_from_history(history: list[tuple[float, int, int]], destination_port: int) -> dict:
    timestamps = [item[0] for item in history]
    fwd_lengths = [float(item[1]) for item in history]
    bwd_lengths = [float(item[2]) for item in history]

    if not timestamps:
        timestamps = [time.time()]

    if len(timestamps) == 1:
        flow_duration_sec = 0.001
        flow_iat = [0.0]
    else:
        flow_duration_sec = max(timestamps[-1] - timestamps[0], 0.001)
        flow_iat = [max((timestamps[idx] - timestamps[idx - 1]) * 1_000_000.0, 0.0) for idx in range(1, len(timestamps))]

    total_fwd = len(fwd_lengths)
    total_bwd = len(bwd_lengths)
    total_fwd_bytes = float(sum(fwd_lengths))
    total_bwd_bytes = float(sum(bwd_lengths))
    all_packet_lengths = fwd_lengths + bwd_lengths

    flow_duration_us = float(flow_duration_sec * 1_000_000.0)
    total_packets = total_fwd + total_bwd
    total_bytes = total_fwd_bytes + total_bwd_bytes

    return {
        "Destination Port": int(destination_port),
        "Flow Duration": flow_duration_us,
        "Total Fwd Packets": int(total_fwd),
        "Total Backward Packets": int(total_bwd),
        "Total Length of Fwd Packets": total_fwd_bytes,
        "Total Length of Bwd Packets": total_bwd_bytes,
        "Fwd Packet Length Mean": _mean(fwd_lengths),
        "Fwd Packet Length Std": _std(fwd_lengths),
        "Bwd Packet Length Mean": _mean(bwd_lengths),
        "Bwd Packet Length Std": _std(bwd_lengths),
        "Flow Bytes/s": total_bytes / flow_duration_sec,
        "Flow Packets/s": float(total_packets) / flow_duration_sec,
        "Flow IAT Mean": _mean(flow_iat),
        "Flow IAT Std": _std(flow_iat),
        "Fwd IAT Mean": _mean(flow_iat),
        "Bwd IAT Mean": _mean(flow_iat),
        "Packet Length Mean": _mean(all_packet_lengths),
        "Packet Length Std": _std(all_packet_lengths),
        "Average Packet Size": _mean(all_packet_lengths),
        "Active Mean": float(flow_duration_sec),
    }


async def flush_inactive_bursts() -> None:
    while True:
        await asyncio.sleep(0.2)
        now = time.time()
        for source_ip, last_seen in list(LAST_PACKET_AT_BY_IP.items()):
            burst = BURST_HISTORY[source_ip]
            if not burst:
                continue
            if now - last_seen <= BURST_IDLE_SECONDS:
                continue

            destination_port = LAST_DEST_PORT_BY_IP[source_ip]
            burst_samples = list(burst)
            BURST_HISTORY[source_ip].clear()

            telemetry_row = build_ml_feature_row_from_history(burst_samples, destination_port)
            logger.info(
                "Flushing burst telemetry ip=%s burst_packets=%s idle_seconds=%s",
                source_ip,
                len(burst_samples),
                BURST_IDLE_SECONDS,
            )
            enqueue_telemetry(source_ip=source_ip, target_system=TARGET_SYSTEM_NAME, features=telemetry_row)


@app.middleware("http")
async def detect_flood(request: Request, call_next):
    source_ip = request.client.host if request.client else "unknown"
    blocked_ips = refresh_blocked_ips_cache()

    # Enforce blocklist before any telemetry processing.
    if request.url.path != "/_control/action" and source_ip in blocked_ips:
        return JSONResponse(
            status_code=403,
            content={"error": "Access denied: source IP is blocked by AEGIS playbook enforcement."},
        )

    response = await call_next(request)

    if request.method != "GET" or request.url.path == "/health":
        return response

    now = time.time()
    req_bytes = _request_size_bytes(request)
    resp_bytes = _response_size_bytes(response.status_code)
    destination_port = request.url.port or RECEIVER_PORT
    record_request(source_ip, now, req_bytes, resp_bytes, destination_port)

    return response


@app.post("/_control/action")
async def control_action(request: Request) -> dict:
    data = await request.json()
    action = data.get("action")

    if action == "block_ip":
        ip_to_block = data.get("ip")
        if not ip_to_block:
            return {"status": "error", "message": "Missing 'ip' for block_ip action"}
        append_ip_to_global_blocklist(str(ip_to_block))
        logger.info("AEGIS ENFORCEMENT: blocked IP %s on flood receiver", ip_to_block)
        return {"status": "success", "message": f"IP {ip_to_block} blocked"}

    if action == "unblock_ip":
        ip_to_unblock = data.get("ip")
        if not ip_to_unblock:
            return {"status": "error", "message": "Missing 'ip' for unblock_ip action"}
        remove_ip_from_global_blocklist(str(ip_to_unblock))
        logger.info("AEGIS ENFORCEMENT: unblocked IP %s on flood receiver", ip_to_unblock)
        return {"status": "success", "message": f"IP {ip_to_unblock} unblocked"}

    return {"status": "ignored", "message": "Action not supported"}


@app.get("/auth/protected")
async def auth_protected(request: Request):
    source_ip = request.client.host if request.client else "unknown"
    auth_header = request.headers.get("authorization", "")

    if not auth_header.lower().startswith("bearer "):
        return JSONResponse(status_code=401, content={"error": "Missing bearer token"})

    token = auth_header[7:].strip()
    honeytoken_tokens = load_honeytoken_tokens_from_db()

    if token in honeytoken_tokens:
        append_ip_to_global_blocklist(source_ip)
        logger.critical("HONEYTOKEN TOKEN DETECTED: ip=%s", source_ip)
        # Return generic auth failure so attacker does not learn this was a trap.
        return JSONResponse(status_code=401, content={"error": "Invalid credentials"})

    if token == VALID_BEARER_TOKEN:
        return {"ok": True, "message": "Access granted"}

    return JSONResponse(status_code=401, content={"error": "Invalid credentials"})


@app.on_event("startup")
async def on_startup() -> None:
    app.state.flush_task = asyncio.create_task(flush_inactive_bursts())
    app.state.sender_tasks = [
        asyncio.create_task(outbound_sender_worker(idx))
        for idx in range(max(1, SENDER_WORKERS))
    ]


@app.on_event("shutdown")
async def on_shutdown() -> None:
    flush_task = getattr(app.state, "flush_task", None)
    sender_tasks = getattr(app.state, "sender_tasks", [])

    if flush_task is not None:
        flush_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await flush_task

    for task in sender_tasks:
        task.cancel()
    for task in sender_tasks:
        with contextlib.suppress(asyncio.CancelledError):
            await task


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "flood-receiver"}


@app.get("/")
async def root() -> dict[str, str]:
    return {"status": "ok", "message": "flood-receiver"}


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def sink(path: str):
    return {"received": True, "path": f"/{path}"}


@app.get("/_stats")
async def stats() -> dict:
    blocked_ips = sorted(refresh_blocked_ips_cache())
    honeytoken_count = len(load_honeytoken_tokens_from_db())
    return {
        "threshold_enabled": False,
        "window_seconds": RATE_WINDOW_SECONDS,
        "burst_idle_seconds": BURST_IDLE_SECONDS,
        "outbound_queue": {
            "size": OUTBOUND_QUEUE.qsize(),
            "max_size": OUTBOUND_QUEUE_MAXSIZE,
            "sender_workers": max(1, SENDER_WORKERS),
            "retry_attempts": ML_RETRY_ATTEMPTS,
        },
        "honeytoken_source": {
            "db_path": str(HONEYTOKEN_DB_PATH),
            "active_tokens_loaded": honeytoken_count,
        },
        "counters": {
            ip: {
                "window_count": len(WINDOW_HISTORY[ip]),
                "retained_count": len(RETAINED_HISTORY[ip]),
                "burst_count": len(BURST_HISTORY[ip]),
                "cumulative_count": TOTAL_REQUESTS_BY_IP[ip],
                "enqueued_count": ENQUEUED_COUNT_BY_IP[ip],
                "sent_count": SENT_COUNT_BY_IP[ip],
                "failed_count": FAILED_COUNT_BY_IP[ip],
                "dropped_count": DROPPED_COUNT_BY_IP[ip],
                "last_packet_at": LAST_PACKET_AT_BY_IP.get(ip),
            }
            for ip in TOTAL_REQUESTS_BY_IP
        },
        "blocked_ips": blocked_ips,
    }


if __name__ == "__main__":
    import uvicorn

    # Port 80 may require elevated privileges or CAP_NET_BIND_SERVICE.
    uvicorn.run(app, host="0.0.0.0", port=RECEIVER_PORT)
