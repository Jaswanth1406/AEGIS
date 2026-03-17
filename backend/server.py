import os
import sys
import uuid
import time
import threading
import collections
import shutil
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import urllib.request
import json
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
# Load the .env file from the root directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
from config import SELECTED_FEATURES, CUSTOM_DATASET_DIR, CUSTOM_MODEL_DIR, MODEL_DIR
from pipeline.inference import InferencePipeline

app = FastAPI(
    title="AEGIS AI — Threat Detection API",
    description="Real-time ML-powered threat detection and classification",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models on startup
pipeline = InferencePipeline()
active_model_type = "general"
is_training_custom_model = False

@app.on_event("startup")
async def startup():
    if active_model_type == "general":
        pipeline.load_models(MODEL_DIR)
    else:
        pipeline.load_models(CUSTOM_MODEL_DIR)

# The URL of the Next.js Frontend Dashboard to receive webhooks
PLATFORM_API_URL = os.environ.get("NEXT_PUBLIC_PLATFORM_API_URL", "http://localhost:3000")
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "internal-dev-key")

def push_threat_to_platform(threat_data: dict):
    if not PLATFORM_API_URL:
        return
    url = f"{PLATFORM_API_URL}/api/internal/threats"
    headers = {
        "Content-Type": "application/json",
        "X-Internal-API-Key": INTERNAL_API_KEY
    }
    try:
        # Use default= to handle numpy types
        payload = json.dumps(threat_data, default=lambda o: float(o) if hasattr(o, 'item') else str(o))
        req = urllib.request.Request(url, data=payload.encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=5) as response:
            print(f"✅ Pushed threat to Platform API: {response.status}")
    except Exception as e:
        print(f"⚠️ Failed to push threat to Platform API ({url}): {e}")


# ─── Request/Response Models ─────────────────────────
class ThreatPredictionRequest(BaseModel):
    source_ip: str = "192.168.1.14"
    target_system: str = "web-server-1"
    features: dict

    class Config:
        json_schema_extra = {
            "example": {
                "source_ip": "192.168.1.14",
                "target_system": "web-server-1",
                "features": {
                    "Destination Port": 80,
                    "Flow Duration": 120000,
                    "Total Fwd Packets": 15,
                    "Total Backward Packets": 10,
                    "Total Length of Fwd Packets": 2400,
                    "Total Length of Bwd Packets": 1800,
                    "Fwd Packet Length Mean": 160.0,
                    "Fwd Packet Length Std": 45.0,
                    "Bwd Packet Length Mean": 180.0,
                    "Bwd Packet Length Std": 50.0,
                    "Flow Bytes/s": 35000.0,
                    "Flow Packets/s": 208.33,
                    "Flow IAT Mean": 4800.0,
                    "Flow IAT Std": 1200.0,
                    "Fwd IAT Mean": 8000.0,
                    "Bwd IAT Mean": 12000.0,
                    "Packet Length Mean": 168.0,
                    "Packet Length Std": 47.0,
                    "Average Packet Size": 168.0,
                    "Active Mean": 50000.0,
                }
            }
        }


class ThreatPredictionResponse(BaseModel):
    threat_type: str
    severity: str
    source_ip: str
    target_system: str
    confidence_score: float
    anomaly_score: float
    explanation: dict
    shap_values: Optional[list] = None
    threat_fingerprint: list[float]


class HealthResponse(BaseModel):
    status: str
    model: str
    features: int
    version: str


# ─── Playbook Models ────────────────────────────────
class PlaybookStep(BaseModel):
    name: str
    description: str
    status: str = "pending"

class Playbook(BaseModel):
    id: str
    name: str
    icon: str
    description: str
    actions: List[str]
    steps: List[PlaybookStep]

class PlaybookExecutionRequest(BaseModel):
    threat_id: str

class PlaybookLog(BaseModel):
    id: str
    playbook_id: str
    playbook_name: str
    threat_id: str
    timestamp: str
    status: str

# ─── Settings Models ────────────────────────────────
class AppSettings(BaseModel):
    session_timeout: int = 30
    dark_mode: bool = True


# ─── In-Memory Data ─────────────────────────────────
playbooks_db = [
    {
        "id": "PB-001",
        "name": "Compromised Account",
        "icon": "🔐",
        "description": "Lock · Reset · Alert",
        "actions": ["Lock Account", "Reset Credentials", "Alert Team"],
        "steps": [
            {"name": "Observe", "description": "Analyze login patterns and confirm compromise indicators"},
            {"name": "Isolate", "description": "Lock the compromised account and revoke all active sessions"},
            {"name": "Remediate", "description": "Reset password, enable MFA, and scan for persistence mechanisms"},
            {"name": "Validate", "description": "Verify account security and restore access with monitoring"},
        ],
    },
    {
        "id": "PB-002",
        "name": "Malicious Traffic",
        "icon": "🚫",
        "description": "Block IP · Firewall · Log",
        "actions": ["Block IP", "Update Firewall", "Log Evidence"],
        "steps": [
            {"name": "Observe", "description": "Capture traffic samples and identify malicious patterns"},
            {"name": "Isolate", "description": "Block source IP at firewall and update WAF rules"},
            {"name": "Remediate", "description": "Scan affected systems and patch vulnerable services"},
            {"name": "Validate", "description": "Confirm traffic is blocked and monitor for evasion attempts"},
        ],
    },
    {
        "id": "PB-003",
        "name": "Malware Behavior",
        "icon": "🦠",
        "description": "Kill · Isolate · Scan",
        "actions": ["Kill Process", "Isolate Host", "Full Scan"],
        "steps": [
            {"name": "Observe", "description": "Identify malicious process and capture memory dump"},
            {"name": "Isolate", "description": "Network-isolate the affected host and kill malicious processes"},
            {"name": "Remediate", "description": "Run full antimalware scan and remove persistence mechanisms"},
            {"name": "Validate", "description": "Verify system integrity and reconnect to network with monitoring"},
        ],
    },
    {
        "id": "PB-004",
        "name": "Network Recon",
        "icon": "🕵️",
        "description": "Deceive · Redirect · Collect",
        "actions": ["Deploy Honeypot", "Redirect Traffic", "Collect Intel"],
        "steps": [
            {"name": "Observe", "description": "Monitor scanning patterns and identify reconnaissance tools"},
            {"name": "Isolate", "description": "Redirect attacker to honeypot environment for intelligence gathering"},
            {"name": "Remediate", "description": "Block scanner IPs and harden exposed services"},
            {"name": "Validate", "description": "Review collected intelligence and update threat indicators"},
        ],
    },
]

playbook_logs = []
settings_db = AppSettings()


# ─── Flood Telemetry Tracker ────────────────────────────────
FLOOD_WINDOW_SECONDS = 5          # Sliding window size
FLOOD_THRESHOLD_RPS = 50          # Requests/s to trigger flood detection
FLOOD_COOLDOWN_SECONDS = 15       # Min seconds between alerts for same IP

class FloodTelemetry:
    """
    Tracks incoming requests per source IP in a sliding time window.
    When the request rate exceeds the threshold, computes CIC-IDS-style
    flow features and feeds them into the ML pipeline.
    """
    def __init__(self):
        # ip -> deque of request timestamps
        self._timestamps: dict[str, collections.deque] = collections.defaultdict(collections.deque)
        # ip -> last alert timestamp (for cooldown)
        self._last_alert: dict[str, float] = {}
        self._lock = threading.Lock()

    def record(self, source_ip: str, payload_bytes: int = 512) -> dict | None:
        """
        Record a request from source_ip. Returns a feature dict if a flood
        is detected (for passing to the ML pipeline), else None.
        """
        now = time.time()
        with self._lock:
            dq = self._timestamps[source_ip]
            dq.append((now, payload_bytes))
            # Prune entries outside the window
            cutoff = now - FLOOD_WINDOW_SECONDS
            while dq and dq[0][0] < cutoff:
                dq.popleft()

            count = len(dq)
            rps = count / FLOOD_WINDOW_SECONDS

            if rps < FLOOD_THRESHOLD_RPS:
                return None  # Normal traffic

            # Check cooldown
            last = self._last_alert.get(source_ip, 0)
            if now - last < FLOOD_COOLDOWN_SECONDS:
                return None  # Already alerted recently

            self._last_alert[source_ip] = now

            # ── Compute CIC-IDS2017-style features ──
            timestamps = [t for t, _ in dq]
            sizes = [b for _, b in dq]
            total_fwd = count
            total_bwd = max(1, count // 10)   # flood has almost no back-traffic

            # Inter-arrival times
            iats = [timestamps[i+1] - timestamps[i] for i in range(len(timestamps)-1)] if len(timestamps) > 1 else [0.001]
            iat_mean = (sum(iats) / len(iats)) * 1e6   # convert to microseconds
            iat_std  = (sum((x - iat_mean/1e6)**2 for x in iats) / max(len(iats),1)) ** 0.5 * 1e6

            flow_duration = max((timestamps[-1] - timestamps[0]) * 1e6, 1)  # microseconds
            total_bytes   = sum(sizes)
            pkt_mean      = total_bytes / max(count, 1)
            pkt_std       = (sum((s - pkt_mean)**2 for s in sizes) / max(count, 1)) ** 0.5
            flow_bytes_s  = total_bytes / FLOOD_WINDOW_SECONDS
            flow_pkts_s   = count / FLOOD_WINDOW_SECONDS

            features = {
                "Destination Port":             80,
                "Flow Duration":                flow_duration,
                "Total Fwd Packets":            total_fwd,
                "Total Backward Packets":       total_bwd,
                "Total Length of Fwd Packets":  total_bytes,
                "Total Length of Bwd Packets":  total_bwd * 40,
                "Fwd Packet Length Mean":       pkt_mean,
                "Fwd Packet Length Std":        pkt_std,
                "Bwd Packet Length Mean":       40.0,
                "Bwd Packet Length Std":        5.0,
                "Flow Bytes/s":                 flow_bytes_s,
                "Flow Packets/s":               flow_pkts_s,
                "Flow IAT Mean":                iat_mean,
                "Flow IAT Std":                 iat_std,
                "Fwd IAT Mean":                 iat_mean,
                "Bwd IAT Mean":                 iat_mean * 20,
                "Packet Length Mean":           pkt_mean,
                "Packet Length Std":            pkt_std,
                "Average Packet Size":          pkt_mean,
                "Active Mean":                  flow_duration,
            }
            return features

flood_telemetry = FloodTelemetry()


# ─── Endpoints ────────────────────────────────────────
@app.get("/", response_model=HealthResponse)
async def health():
    return {
        "status": "operational",
        "model": "AEGIS AI Threat Detection",
        "features": len(SELECTED_FEATURES),
        "version": "1.0.0",
    }


# ─── Model Management Endpoints ──────────────────────
def background_train_task(csv_path: str):
    global is_training_custom_model
    try:
        from train import train
        print(f"Starting background training with {csv_path}...")
        train(custom_csv_path=csv_path, output_dir=CUSTOM_MODEL_DIR)
        print("Background training completed successfully.")
    except Exception as e:
        print(f"Error during custom model training: {e}")
    finally:
        is_training_custom_model = False


@app.post("/api/model/upload_and_train")
async def upload_and_train(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    global is_training_custom_model
    if is_training_custom_model:
        raise HTTPException(status_code=400, detail="A model is already training.")
    
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
    os.makedirs(CUSTOM_DATASET_DIR, exist_ok=True)
    file_path = os.path.join(CUSTOM_DATASET_DIR, "custom_upload.csv")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    is_training_custom_model = True
    background_tasks.add_task(background_train_task, file_path)
    return {"message": "File uploaded and training started in background."}


class ModelSwitchRequest(BaseModel):
    model_type: str  # "general" or "custom"


@app.post("/api/model/switch")
async def switch_model(req: ModelSwitchRequest):
    global active_model_type, pipeline
    new_type = req.model_type
    if new_type not in ["general", "custom"]:
        raise HTTPException(status_code=400, detail="Invalid model type. Must be 'general' or 'custom'.")
        
    if new_type == "custom":
        if not os.path.exists(os.path.join(CUSTOM_MODEL_DIR, "xgboost_classifier.joblib")):
            raise HTTPException(status_code=400, detail="Custom model not found. Please train one first.")
        active_model_type = "custom"
        pipeline.load_models(CUSTOM_MODEL_DIR)
    else:
        active_model_type = "general"
        pipeline.load_models(MODEL_DIR)
        
    return {"message": f"Successfully switched to {active_model_type} model."}


@app.get("/api/model/status")
async def model_status():
    global active_model_type, is_training_custom_model
    has_custom = os.path.exists(os.path.join(CUSTOM_MODEL_DIR, "xgboost_classifier.joblib"))
    return {
        "active_model": active_model_type,
        "is_training": is_training_custom_model,
        "custom_model_available": has_custom
    }


@app.post("/predict", response_model=ThreatPredictionResponse)
async def predict(request: ThreatPredictionRequest, background_tasks: BackgroundTasks):
    """
    Analyze network flow features and detect threats.
    Returns matched schema for backend consumption.
    """
    result = pipeline.predict(
        raw_features=request.features,
        source_ip=request.source_ip,
        target_system=request.target_system
    )
    
    # Forward the threat detection to the main Platform Backend API
    if result["threat_type"] != "Benign":
        print(f"📡 Queuing push for {result['threat_type']} prediction to Platform API...")
        background_tasks.add_task(push_threat_to_platform, result)
    else:
        print(f"🟢 Allowed Benign traffic. Not pushing to threat dashboard.")
        
    return result


@app.get("/features")
async def get_features():
    """List expected input features."""
    return {"features": SELECTED_FEATURES, "count": len(SELECTED_FEATURES)}


@app.api_route("/demo/flood", methods=["GET", "POST", "PUT"])
async def flood_target(request: Request, background_tasks: BackgroundTasks):
    """
    Demo flood target endpoint.
    Attackers hammer this endpoint; the server measures the request rate
    and feeds detected floods into the ML pipeline.
    """
    source_ip = request.client.host if request.client else "0.0.0.0"
    # Estimate payload size from Content-Length header or default 512 bytes
    payload_bytes = int(request.headers.get("content-length", 512))

    features = flood_telemetry.record(source_ip, payload_bytes)

    if features:
        # Run ML inference synchronously (fast) then push in background
        result = pipeline.predict(
            raw_features=features,
            source_ip=source_ip,
            target_system="demo-flood-target",
        )
        print(f"🚨 FLOOD DETECTED from {source_ip} → {result['threat_type'].upper()} | {result['severity']}")
        if result["threat_type"] != "Benign":
            background_tasks.add_task(push_threat_to_platform, result)

    # Always return 200 (the attacker thinks it's a real endpoint)
    return {"status": "ok"}


@app.post("/api/telemetry/ingest", response_model=ThreatPredictionResponse)
async def ingest_telemetry(request: ThreatPredictionRequest, background_tasks: BackgroundTasks):
    """
    Ingest raw telemetry data from an external source (e.g., an external firewall or agent).
    Processes the exact same network flow features and runs ML inference.
    """
    # Run ML inference synchronously
    result = pipeline.predict(
        raw_features=request.features,
        source_ip=request.source_ip,
        target_system=request.target_system
    )
    
    print(f"📡 INGESTED TELEMETRY from {request.source_ip} → {result['threat_type'].upper()} | {result['severity']}")
    
    # Forward the threat detection to the main Platform Backend API if it's not normal traffic
    if result["threat_type"] != "Benign":
        background_tasks.add_task(push_threat_to_platform, result)
        
    return result


# ─── Playbook Endpoints ──────────────────────────────
@app.get("/api/playbooks", response_model=List[Playbook])
async def list_playbooks():
    return playbooks_db

@app.post("/api/playbooks", response_model=Playbook)
async def create_playbook(playbook: Playbook):
    playbooks_db.append(playbook.dict())
    return playbook

@app.get("/api/playbooks/{playbook_id}", response_model=Playbook)
async def get_playbook(playbook_id: str):
    for pb in playbooks_db:
        if pb["id"] == playbook_id:
            return pb
    raise HTTPException(status_code=404, detail="Playbook not found")

@app.put("/api/playbooks/{playbook_id}", response_model=Playbook)
async def update_playbook(playbook_id: str, updated_pb: Playbook):
    for i, pb in enumerate(playbooks_db):
        if pb["id"] == playbook_id:
            playbooks_db[i] = updated_pb.dict()
            return updated_pb
    raise HTTPException(status_code=404, detail="Playbook not found")

@app.get("/api/playbooks/logs", response_model=List[PlaybookLog])
async def list_playbook_logs():
    return playbook_logs

@app.post("/api/playbooks/{playbook_id}/execute")
async def execute_playbook(playbook_id: str, request: PlaybookExecutionRequest):
    playbook = None
    for pb in playbooks_db:
        if pb["id"] == playbook_id:
            playbook = pb
            break
    
    if not playbook:
        raise HTTPException(status_code=404, detail="Playbook not found")
    
    # Mock execution log
    log_entry = {
        "id": str(uuid.uuid4()),
        "playbook_id": playbook_id,
        "playbook_name": playbook["name"],
        "threat_id": request.threat_id,
        "timestamp": datetime.now().isoformat(),
        "status": "completed"
    }
    playbook_logs.append(log_entry)
    
    return {"message": f"Executing playbook {playbook['name']} for threat {request.threat_id}", "log": log_entry}


# ─── Settings Endpoints ────────────────────────────────
@app.get("/api/settings", response_model=AppSettings)
async def get_settings():
    return settings_db


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
