import logging

from fastapi import FastAPI, Request, status

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml_threat_receiver")

app = FastAPI(title="Mock ML Threat Receiver")


@app.post("/api/threats/ingest", status_code=status.HTTP_202_ACCEPTED)
async def ingest_threat(request: Request):
    payload = await request.json()
    logger.warning("ML RECEIVER got threat: %s", payload)
    return {"accepted": True, "pipeline": "ml-threat-intake"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "mock-ml-receiver"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=9000)
