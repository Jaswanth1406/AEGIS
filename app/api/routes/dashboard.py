from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.dashboard import AttackMapEntry, DashboardStatsResponse
from app.services.metrics_service import get_attack_map, get_dashboard_stats


router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
def dashboard_stats(db: Session = Depends(get_db)) -> DashboardStatsResponse:
    return DashboardStatsResponse.model_validate(get_dashboard_stats(db))


@router.get("/attacks/global", response_model=list[AttackMapEntry])
def attacks_global(db: Session = Depends(get_db)) -> list[AttackMapEntry]:
    return [AttackMapEntry.model_validate(item) for item in get_attack_map(db)]
