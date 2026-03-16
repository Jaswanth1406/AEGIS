from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Enum, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.enums import SeverityEnum, ThreatStatusEnum


class Threat(Base):
    __tablename__ = "threats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    threat_type: Mapped[str] = mapped_column(String(120), nullable=False)
    severity: Mapped[SeverityEnum] = mapped_column(Enum(SeverityEnum), nullable=False)
    source_ip: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    target_system: Mapped[str] = mapped_column(String(120), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    status: Mapped[ThreatStatusEnum] = mapped_column(Enum(ThreatStatusEnum), default=ThreatStatusEnum.INVESTIGATING, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    anomaly_score: Mapped[float] = mapped_column(Float, nullable=False)
    explanation_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    threat_fingerprint: Mapped[list[float]] = mapped_column(JSON, nullable=False)
