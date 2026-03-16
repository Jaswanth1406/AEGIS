from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.playbook import Playbook
from app.models.playbook_log import PlaybookExecutionLog
from app.models.threat import Threat
from app.models.user import User
from app.schemas.playbook import PlaybookExecuteRequest, PlaybookExecuteResponse, PlaybookLogResponse, PlaybookResponse
from app.services.audit_service import write_audit_log
from app.services.playbook_service import execute_playbook, parse_steps


router = APIRouter(prefix="/api/playbooks", tags=["playbooks"])


@router.get("", response_model=list[PlaybookResponse])
def get_playbooks(_: User = Depends(require_roles("admin", "analyst", "viewer")), db: Session = Depends(get_db)) -> list[PlaybookResponse]:
    items = db.query(Playbook).order_by(Playbook.id.asc()).all()
    return [PlaybookResponse(id=i.id, name=i.name, description=i.description, steps=parse_steps(i.steps), created_at=i.created_at) for i in items]


@router.get("/logs", response_model=list[PlaybookLogResponse])
def get_playbook_logs(
    _: User = Depends(require_roles("admin", "analyst")),
    db: Session = Depends(get_db),
) -> list[PlaybookLogResponse]:
    logs = db.query(PlaybookExecutionLog).order_by(PlaybookExecutionLog.created_at.desc()).all()
    return [PlaybookLogResponse.model_validate(log, from_attributes=True) for log in logs]


@router.get("/{playbook_id}", response_model=PlaybookResponse)
def get_playbook(playbook_id: int, _: User = Depends(require_roles("admin", "analyst", "viewer")), db: Session = Depends(get_db)) -> PlaybookResponse:
    item = db.get(Playbook, playbook_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Playbook not found")
    return PlaybookResponse(id=item.id, name=item.name, description=item.description, steps=parse_steps(item.steps), created_at=item.created_at)


@router.post("/{playbook_id}/execute", response_model=PlaybookExecuteResponse)
def run_playbook(
    playbook_id: int,
    payload: PlaybookExecuteRequest,
    current_user: User = Depends(require_roles("admin", "analyst")),
    db: Session = Depends(get_db),
) -> PlaybookExecuteResponse:
    playbook = db.get(Playbook, playbook_id)
    if playbook is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Playbook not found")

    threat = db.get(Threat, payload.threat_id)
    if threat is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Threat not found")

    log = execute_playbook(db, playbook, threat, current_user.email)
    write_audit_log(db, current_user.id, "playbook_executed", {"playbook_id": playbook.id, "threat_id": threat.id})

    return PlaybookExecuteResponse(playbook_id=playbook.id, execution_status=log.status, steps_completed=len(log.log_entries))


