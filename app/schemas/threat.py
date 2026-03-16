from datetime import datetime

from pydantic import BaseModel, Field, IPvAnyAddress

from app.models.enums import SeverityEnum, ThreatStatusEnum


class ShapValue(BaseModel):
    feature: str
    value: float


class ThreatIngestionRequest(BaseModel):
    threat_type: str
    severity: SeverityEnum
    source_ip: IPvAnyAddress
    target_system: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    anomaly_score: float = Field(ge=0.0, le=1.0)
    explanation: dict
    shap_values: list[ShapValue] = Field(default_factory=list)
    threat_fingerprint: list[float]


class ThreatStatusUpdateRequest(BaseModel):
    status: ThreatStatusEnum


class ThreatResponse(BaseModel):
    id: int
    threat_type: str
    severity: SeverityEnum
    source_ip: str
    target_system: str
    timestamp: datetime
    status: ThreatStatusEnum
    confidence_score: float
    anomaly_score: float
    explanation: dict
    shap_values: list[ShapValue]
    ai_analysis: str | None
    suggested_playbook: list[dict] | None = None
    fingerprint: list[float]


class ThreatListResponse(BaseModel):
    items: list[ThreatResponse]
    page: int
    limit: int
    total: int
    has_next: bool
