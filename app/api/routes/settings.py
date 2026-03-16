from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.setting import Setting
from app.models.user import User
from app.schemas.settings import SettingsPayload
from app.services.audit_service import write_audit_log


router = APIRouter(prefix="/api/settings", tags=["settings"])


def _get_or_create_settings(db: Session) -> Setting:
    item = db.query(Setting).first()
    if item is None:
        item = Setting(
            alert_thresholds={"critical": 0.9, "high": 0.75, "medium": 0.5},
            notification_preferences={"email": True, "slack": False},
            playbook_automation_enabled=False,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
    return item


@router.get("", response_model=SettingsPayload)
def get_settings(_: User = Depends(require_roles("admin", "analyst", "viewer")), db: Session = Depends(get_db)) -> SettingsPayload:
    item = _get_or_create_settings(db)
    return SettingsPayload.model_validate(item, from_attributes=True)


@router.put("", response_model=SettingsPayload)
def update_settings(
    payload: SettingsPayload,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
) -> SettingsPayload:
    item = _get_or_create_settings(db)
    item.alert_thresholds = payload.alert_thresholds
    item.notification_preferences = payload.notification_preferences
    item.playbook_automation_enabled = payload.playbook_automation_enabled
    db.commit()
    db.refresh(item)

    write_audit_log(db, current_user.id, "settings_updated", payload.model_dump())
    return SettingsPayload.model_validate(item, from_attributes=True)
