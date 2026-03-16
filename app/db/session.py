from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


engine = create_engine(settings.database_url, future=True, connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.models import base  # noqa: F401
    from app.models import (  # noqa: F401
        AuditLog,
        Playbook,
        PlaybookExecutionLog,
        Setting,
        Threat,
        User,
    )

    base.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(Setting).first() is None:
            db.add(
                Setting(
                    alert_thresholds={"critical": 0.9, "high": 0.75, "medium": 0.5},
                    notification_preferences={"email": True, "slack": False},
                    playbook_automation_enabled=False,
                )
            )

        if db.query(Playbook).count() == 0:
            db.add(
                Playbook(
                    name="Default Threat Containment",
                    description="Prototype playbook to observe, isolate, remediate, and validate.",
                    steps="Observe,Isolate,Remediate,Validate",
                )
            )
        db.commit()
    finally:
        db.close()
