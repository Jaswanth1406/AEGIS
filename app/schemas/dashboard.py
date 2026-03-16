from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    critical_threats: int
    active_alerts: int
    threats_contained: int
    avg_response_time: float


class AttackMapEntry(BaseModel):
    origin_country: str
    origin_coordinates: list[float]
    target_coordinates: list[float]
    severity: str
