from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, verify_internal_api_key
from app.db.session import get_db
from app.models.threat import Threat
from app.models.user import User
from app.schemas.threat import ThreatIngestionRequest, ThreatListResponse, ThreatResponse, ThreatStatusUpdateRequest
from app.services.audit_service import write_audit_log
from app.services.threat_service import create_threat, list_threats
from app.streaming.sse import threat_event_bus


router = APIRouter(tags=["threats"])


def to_threat_response(threat: Threat) -> ThreatResponse:
    return ThreatResponse(
        id=threat.id,
        threat_type=threat.threat_type,
        severity=threat.severity,
        source_ip=threat.source_ip,
        target_system=threat.target_system,
        timestamp=threat.timestamp,
        status=threat.status,
        confidence_score=threat.confidence_score,
        anomaly_score=threat.anomaly_score,
        explanation=threat.explanation_json,
        fingerprint=threat.threat_fingerprint,
    )


@router.post("/api/internal/threats", response_model=ThreatResponse, dependencies=[Depends(verify_internal_api_key)], status_code=status.HTTP_201_CREATED)
async def ingest_threat(payload: ThreatIngestionRequest, db: Session = Depends(get_db)) -> ThreatResponse:
    threat = create_threat(db, payload)
    await threat_event_bus.publish({"event": "threat.created", "payload": to_threat_response(threat).model_dump(mode="json")})
    return to_threat_response(threat)


@router.get("/api/threats", response_model=ThreatListResponse)
def get_threats(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=200),
    severity: str | None = None,
    search: str | None = None,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ThreatListResponse:
    items, total = list_threats(db, page, limit, severity, search)
    response_items = [to_threat_response(item) for item in items]
    return ThreatListResponse(items=response_items, page=page, limit=limit, total=total, has_next=(page * limit) < total)


@router.get("/api/threats/{threat_id}", response_model=ThreatResponse)
def get_threat(threat_id: int, _: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ThreatResponse:
    threat = db.get(Threat, threat_id)
    if threat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Threat not found")
    return to_threat_response(threat)


@router.patch("/api/threats/{threat_id}/status", response_model=ThreatResponse)
async def update_threat_status(
    threat_id: int,
    payload: ThreatStatusUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ThreatResponse:
    threat = db.get(Threat, threat_id)
    if threat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Threat not found")

    threat.status = payload.status
    db.commit()
    db.refresh(threat)

    write_audit_log(db, current_user.id, "threat_status_changed", {"threat_id": threat.id, "status": payload.status.value})
    await threat_event_bus.publish({"event": "threat.status_updated", "payload": {"id": threat.id, "status": payload.status.value}})
    return to_threat_response(threat)


@router.get("/api/threats/stream")
async def threat_stream(request: Request, _: User = Depends(get_current_user)) -> StreamingResponse:
    async def event_generator():
        async for event in threat_event_bus.subscribe():
            if await request.is_disconnected():
                break
            yield event

    return StreamingResponse(event_generator(), media_type="text/event-stream")
