from sqlalchemy.orm import Session

from app.models.audit import AuditLog


def write_audit_log(db: Session, user_id: int | None, action: str, metadata: dict) -> None:
    entry = AuditLog(user_id=user_id, action=action, metadata_json=metadata)
    db.add(entry)
    db.commit()
