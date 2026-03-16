from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.playbook import Playbook
from app.models.playbook_log import PlaybookExecutionLog
from app.models.threat import Threat
from app.schemas.playbook import (
    PlaybookCreateRequest,
    PlaybookExecuteRequest,
    PlaybookExecuteResponse,
    PlaybookLogResponse,
    PlaybookResponse,
    PlaybookUpdateRequest,
)
from app.services.audit_service import write_audit_log
from app.services.playbook_service import execute_playbook


router = APIRouter(prefix="/api/playbooks", tags=["playbooks"])


def _to_response(item: Playbook) -> PlaybookResponse:
    return PlaybookResponse(
        id=item.id,
        name=item.name,
        description=item.description,
        steps=item.steps,
        created_at=item.created_at,
    )


def _validate_steps(steps: list[dict]) -> list[dict]:
    if not steps:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="At least one step is required")
    for step in steps:
        if "action" not in step or not isinstance(step["action"], str):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Each step must have a valid 'action' string")
        if "params" not in step or not isinstance(step["params"], dict):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Each step must have a 'params' dictionary")
    return steps


@router.get("", response_model=list[PlaybookResponse])
def get_playbooks(db: Session = Depends(get_db)) -> list[PlaybookResponse]:
    items = db.query(Playbook).order_by(Playbook.id.asc()).all()
    return [_to_response(i) for i in items]


@router.post("", response_model=PlaybookResponse, status_code=status.HTTP_201_CREATED)
def create_playbook(payload: PlaybookCreateRequest, db: Session = Depends(get_db)) -> PlaybookResponse:
    item = Playbook(
        name=payload.name.strip(),
        description=payload.description.strip(),
        steps=_validate_steps(payload.steps),
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    write_audit_log(db, None, "playbook_created", {"playbook_id": item.id})
    return _to_response(item)


@router.get("/logs", response_model=list[PlaybookLogResponse])
def get_playbook_logs(
    db: Session = Depends(get_db),
) -> list[PlaybookLogResponse]:
    logs = db.query(PlaybookExecutionLog).order_by(PlaybookExecutionLog.created_at.desc()).all()
    return [PlaybookLogResponse.model_validate(log, from_attributes=True) for log in logs]


@router.get("/{playbook_id}", response_model=PlaybookResponse)
def get_playbook(playbook_id: int, db: Session = Depends(get_db)) -> PlaybookResponse:
    item = db.get(Playbook, playbook_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Playbook not found")
    return _to_response(item)


@router.put("/{playbook_id}", response_model=PlaybookResponse)
def update_playbook(playbook_id: int, payload: PlaybookUpdateRequest, db: Session = Depends(get_db)) -> PlaybookResponse:
    item = db.get(Playbook, playbook_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Playbook not found")

    if payload.name is not None:
        item.name = payload.name.strip()
    if payload.description is not None:
        item.description = payload.description.strip()
    if payload.steps is not None:
        item.steps = _validate_steps(payload.steps)

    db.commit()
    db.refresh(item)

    write_audit_log(db, None, "playbook_updated", {"playbook_id": item.id})
    return _to_response(item)


@router.post("/{playbook_id}/execute", response_model=PlaybookExecuteResponse)
async def run_playbook(
    playbook_id: int,
    payload: PlaybookExecuteRequest,
    db: Session = Depends(get_db),
) -> PlaybookExecuteResponse:
    playbook = db.get(Playbook, playbook_id)
    if playbook is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Playbook not found")

    threat = db.get(Threat, payload.threat_id)
    if threat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Threat not found")

    log = await execute_playbook(db, playbook, threat, "anonymous")
    write_audit_log(db, None, "playbook_executed", {"playbook_id": playbook.id, "threat_id": threat.id})

    return PlaybookExecuteResponse(playbook_id=playbook.id, execution_status=log.status, steps_completed=len(log.log_entries))


