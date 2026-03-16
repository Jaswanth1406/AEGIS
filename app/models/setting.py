from sqlalchemy import Boolean, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Setting(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    alert_thresholds: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    notification_preferences: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    playbook_automation_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
