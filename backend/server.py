"""
AEGIS AI — FastAPI Inference Server
Real-time threat detection API.
"""
import os
import sys
from fastapi import FastAPI, BackgroundTasks
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
