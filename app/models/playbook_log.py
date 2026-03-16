from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PlaybookExecutionLog(Base):
    __tablename__ = "playbook_execution_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    playbook_id: Mapped[int] = mapped_column(ForeignKey("playbooks.id"), nullable=False)
    threat_id: Mapped[int] = mapped_column(ForeignKey("threats.id"), nullable=False)
    executed_by: Mapped[str] = mapped_column(String(120), nullable=False)
    execution_time: Mapped[float] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(String(60), nullable=False)
    log_entries: Mapped[list[dict]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
