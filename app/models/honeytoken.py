from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Honeytoken(Base):
    __tablename__ = "honeytokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    token_type: Mapped[str] = mapped_column(String(60), nullable=False)  # credential, api_key, database_record, file, url
    token_value: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)
    deployed_location: Mapped[str] = mapped_column(String(250), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="active", nullable=False)  # active, triggered, deactivated
    triggered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
