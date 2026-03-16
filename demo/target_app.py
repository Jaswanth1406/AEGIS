from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
import httpx
import logging
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("target_app")

app = FastAPI(title="Corporate Target System")

# Internal state of the target system
BLOCKED_IPS = set()
AEGIS_URL = "http://127.0.0.1:8000/api/internal/threats"
HONEYTOKEN_CREDS = {"admin_backup", "XyZ123!dummy"}

@app.middleware("http")
async def check_blocked_ip(request: Request, call_next):
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    if client_ip in BLOCKED_IPS:
        logger.warning(f"BLOCKED request from {client_ip}")
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"error": "Access Denied: Your IP has been blocked by Corporate Security."}
        )
        
    response = await call_next(request)
    return response

@app.get("/")
def home():
    return {"message": "Welcome to the Corporate Portal"}

@app.post("/login")
async def login(request: Request):
    data = await request.json()
    username = data.get("username", "")
    password = data.get("password", "")
    client_ip = request.client.host if request.client else "127.0.0.1"
    
    # Check if they are using the honeytoken!
    if username == "admin_backup" and password == "XyZ123!dummy":
        logger.critical(f"HONEYTOKEN TRIPPED by {client_ip}! Sending alert to AEGIS...")
        
        # Act like a SIEM: send the threat to AEGIS
        telemetry = {
            "threat_type": "Honeytoken Triggered: Backup Admin Creds",
            "severity": "CRITICAL",
            "source_ip": client_ip,
            "target_system": "Corporate Portal Login",
            "confidence_score": 1.0,
            "anomaly_score": 1.0,
            "explanation": {
                "honeytoken_id": 1,
                "context": {"method": "Web login from Python script"}
            },
            "shap_values": [],
            "threat_fingerprint": [1.0, 1.0, 1.0, 1.0]
        }
        
        # Send asynchronously so we don't block the response
        asyncio.create_task(report_to_aegis(telemetry))
        
        # We still return invalid credentials to the attacker so they don't know they hit a trap
        return {"error": "Invalid credentials"}
        
    if username == "admin" and password == "secret":
        return {"token": "valid_corporate_token_999"}
        
    return {"error": "Invalid credentials"}


async def report_to_aegis(telemetry_data: dict):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(AEGIS_URL, json=telemetry_data, timeout=5.0)
            logger.info(f"AEGIS notified successfully. Status: {resp.status_code}")
    except Exception as e:
        logger.error(f"Failed to notify AEGIS: {e}")


# --- Secret Control API for AEGIS to enforce playbooks ---

@app.post("/_control/action")
async def aegis_control(request: Request):
    """AEGIS calls this endpoint to enact playbook responses on the Target System."""
    data = await request.json()
    action = data.get("action")
    
    if action == "block_ip":
        ip_to_block = data.get("ip")
        if ip_to_block:
            BLOCKED_IPS.add(ip_to_block)
            logger.info(f"AEGIS ENFORCEMENT: Blocked IP {ip_to_block}")
            return {"status": "success", "message": f"IP {ip_to_block} added to blocklist"}
            
    return {"status": "ignored", "message": "Action not recognized or not implemented for this target"}

if __name__ == "__main__":
    import uvicorn
    # Run the target asset on port 8001
    uvicorn.run(app, host="0.0.0.0", port=8001)
