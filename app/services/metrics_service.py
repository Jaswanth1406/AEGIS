from dataclasses import dataclass

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.enums import SeverityEnum, ThreatStatusEnum
from app.models.threat import Threat


@dataclass
class AttackGeo:
    country: str
    coords: list[float]


# Placeholder geo mapping for prototype.
GEO_BY_PREFIX = {
    "10": AttackGeo(country="United States", coords=[37.7749, -122.4194]),
    "172": AttackGeo(country="Germany", coords=[52.52, 13.405]),
    "192": AttackGeo(country="India", coords=[12.9716, 77.5946]),
}


def get_dashboard_stats(db: Session) -> dict:
    critical_threats = db.query(func.count(Threat.id)).filter(Threat.severity == SeverityEnum.CRITICAL).scalar() or 0
    active_alerts = db.query(func.count(Threat.id)).filter(Threat.status != ThreatStatusEnum.RESOLVED).scalar() or 0
    threats_contained = db.query(func.count(Threat.id)).filter(Threat.status == ThreatStatusEnum.CONTAINED).scalar() or 0

    # Prototype metric: true response-time requires status transition timestamps.
    # Until that field exists, return 0.0 to keep API contract stable.
    avg_response_time = 0.0

    return {
        "critical_threats": int(critical_threats),
        "active_alerts": int(active_alerts),
        "threats_contained": int(threats_contained),
        "avg_response_time": float(avg_response_time),
    }


def get_attack_map(db: Session) -> list[dict]:
    threats = db.query(Threat).order_by(Threat.timestamp.desc()).limit(100).all()
    target_coords = [37.7749, -122.4194]
    result = []
    for threat in threats:
        prefix = threat.source_ip.split(".")[0]
        geo = GEO_BY_PREFIX.get(prefix, AttackGeo(country="Unknown", coords=[0.0, 0.0]))
        result.append(
            {
                "origin_country": geo.country,
                "origin_coordinates": geo.coords,
                "target_coordinates": target_coords,
                "severity": threat.severity.value,
            }
        )
    return result
