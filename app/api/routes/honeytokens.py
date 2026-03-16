from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db, SessionLocal
from app.models.honeytoken import Honeytoken
from app.models.threat import Threat
from app.models.enums import SeverityEnum, ThreatStatusEnum
from app.schemas.honeytoken import HoneytokenCreateRequest, HoneytokenResponse, HoneytokenValidateRequest
from app.services.audit_service import write_audit_log
from app.services.ai_service import generate_threat_analysis, generate_playbook_suggestion
from app.streaming.sse import threat_event_bus


router = APIRouter(prefix="/api/honeytokens", tags=["honeytokens"])


def _to_response(item: Honeytoken) -> HoneytokenResponse:
    return HoneytokenResponse(
        id=item.id,
        name=item.name,
        token_type=item.token_type,
        token_value=item.token_value,
        deployed_location=item.deployed_location,
        status=item.status,
        triggered_at=item.triggered_at,
        created_at=item.created_at,
    )


# --- CRUD ---

@router.get("", response_model=list[HoneytokenResponse])
def list_honeytokens(db: Session = Depends(get_db)) -> list[HoneytokenResponse]:
    items = db.query(Honeytoken).order_by(Honeytoken.created_at.desc()).all()
    return [_to_response(i) for i in items]


@router.post("", response_model=HoneytokenResponse, status_code=status.HTTP_201_CREATED)
def create_honeytoken(payload: HoneytokenCreateRequest, db: Session = Depends(get_db)) -> HoneytokenResponse:
    item = Honeytoken(
        name=payload.name.strip(),
        token_type=payload.token_type.strip(),
        token_value=payload.token_value.strip(),
        deployed_location=payload.deployed_location.strip(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    write_audit_log(db, None, "honeytoken_created", {"honeytoken_id": item.id, "name": item.name})
    return _to_response(item)


@router.get("/{honeytoken_id}", response_model=HoneytokenResponse)
def get_honeytoken(honeytoken_id: int, db: Session = Depends(get_db)) -> HoneytokenResponse:
    item = db.get(Honeytoken, honeytoken_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Honeytoken not found")
    return _to_response(item)


@router.delete("/{honeytoken_id}")
def deactivate_honeytoken(honeytoken_id: int, db: Session = Depends(get_db)):
    item = db.get(Honeytoken, honeytoken_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Honeytoken not found")
    item.status = "deactivated"
    db.commit()
    write_audit_log(db, None, "honeytoken_deactivated", {"honeytoken_id": item.id})
    return {"message": f"Honeytoken '{item.name}' deactivated"}


# --- Validation / Trigger ---

async def _run_honeytoken_ai_task(threat_id: int, payload_data: dict) -> None:
    """Background task: generate AI analysis + playbook suggestion for the auto-created threat."""
    analysis = await generate_threat_analysis(payload_data, [])
    suggestion = await generate_playbook_suggestion(payload_data, [])

    db = SessionLocal()
    try:
        threat = db.get(Threat, threat_id)
        if threat:
            if analysis:
                threat.ai_analysis = analysis
            if suggestion:
                threat.suggested_playbook = suggestion
            db.commit()
            db.refresh(threat)

            from app.api.routes.threats import to_threat_response
            await threat_event_bus.publish({
                "event": "threat.ai_analysis_completed",
                "payload": to_threat_response(threat).model_dump(mode="json")
            })
    finally:
        db.close()


@router.post("/validate", status_code=status.HTTP_201_CREATED)
async def validate_honeytoken(
    payload: HoneytokenValidateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Look up the honeytoken
    token = db.query(Honeytoken).filter(Honeytoken.token_value == payload.token_value).first()
    if token is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Honeytoken not found")

    if token.status == "deactivated":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Honeytoken is deactivated")

    # Mark as triggered
    token.status = "triggered"
    token.triggered_at = datetime.now(timezone.utc)
    db.commit()

    # Auto-create a CRITICAL threat
    threat = Threat(
        threat_type=f"Honeytoken Triggered: {token.name}",
        severity=SeverityEnum.CRITICAL,
        source_ip=payload.source_ip,
        target_system=token.deployed_location,
        status=ThreatStatusEnum.INVESTIGATING,
        confidence_score=1.0,
        anomaly_score=1.0,
        explanation_json={
            "honeytoken_id": token.id,
            "honeytoken_type": token.token_type,
            "deployed_location": token.deployed_location,
            "context": payload.context or {},
        },
        shap_values=[],
        threat_fingerprint=[1.0, 1.0, 1.0, 1.0],
    )
    db.add(threat)
    db.commit()
    db.refresh(threat)

    # Broadcast SSE
    from app.api.routes.threats import to_threat_response
    await threat_event_bus.publish({
        "event": "threat.created",
        "payload": to_threat_response(threat).model_dump(mode="json")
    })

    # Fire AI background task
    threat_data = {
        "threat_type": threat.threat_type,
        "severity": threat.severity.value,
        "source_ip": threat.source_ip,
        "target_system": threat.target_system,
        "confidence_score": threat.confidence_score,
        "anomaly_score": threat.anomaly_score,
    }
    background_tasks.add_task(_run_honeytoken_ai_task, threat.id, threat_data)

    write_audit_log(db, None, "honeytoken_triggered", {
        "honeytoken_id": token.id,
        "threat_id": threat.id,
        "source_ip": payload.source_ip,
    })

    return {
        "message": f"Honeytoken '{token.name}' triggered! CRITICAL threat #{threat.id} auto-generated.",
        "threat_id": threat.id,
        "honeytoken_id": token.id,
    }
