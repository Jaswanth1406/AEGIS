from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.threat import Threat
from app.schemas.threat import ThreatIngestionRequest


def create_threat(db: Session, payload: ThreatIngestionRequest) -> Threat:
    threat = Threat(
        threat_type=payload.threat_type,
        severity=payload.severity,
        source_ip=str(payload.source_ip),
        target_system=payload.target_system,
        confidence_score=payload.confidence_score,
        anomaly_score=payload.anomaly_score,
        explanation_json=payload.explanation,
        threat_fingerprint=payload.threat_fingerprint,
    )
    db.add(threat)
    db.commit()
    db.refresh(threat)
    return threat


def list_threats(db: Session, page: int, limit: int, severity: str | None, search: str | None) -> tuple[list[Threat], int]:
    query = db.query(Threat)

    if severity:
        query = query.filter(Threat.severity == severity)

    if search:
        like = f"%{search}%"
        query = query.filter(or_(Threat.threat_type.ilike(like), Threat.source_ip.ilike(like), Threat.target_system.ilike(like)))

    total = query.count()
    items = query.order_by(Threat.timestamp.desc()).offset((page - 1) * limit).limit(limit).all()
    return items, total
