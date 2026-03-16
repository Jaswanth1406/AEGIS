import os
import sys
import uuid
import time
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import urllib.request
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import SELECTED_FEATURES
from pipeline.inference import InferencePipeline

app = FastAPI(
    title="AEGIS AI — Threat Detection API",
    description="Real-time ML-powered threat detection and classification",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models on startup
pipeline = InferencePipeline()


@app.on_event("startup")
async def startup():
    pipeline.load_models()

PLATFORM_API_URL = os.environ.get("PLATFORM_API_URL", "http://11.12.6.240:8000")
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
        req = urllib.request.Request(url, data=json.dumps(threat_data).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=3) as response:
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


# ─── Endpoints ────────────────────────────────────────
@app.get("/", response_model=HealthResponse)
async def health():
    return {
        "status": "operational",
        "model": "AEGIS AI Threat Detection",
        "features": len(SELECTED_FEATURES),
        "version": "1.0.0",
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
    if result["threat_type"] != "benign":
        background_tasks.add_task(push_threat_to_platform, result)
        
    return result


@app.get("/features")
async def get_features():
    """List expected input features."""
    return {"features": SELECTED_FEATURES, "count": len(SELECTED_FEATURES)}


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
