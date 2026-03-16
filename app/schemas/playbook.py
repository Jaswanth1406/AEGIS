from datetime import datetime

from pydantic import BaseModel


class PlaybookResponse(BaseModel):
    id: int
    name: str
    description: str
    steps: list[str]
    created_at: datetime


class PlaybookExecuteRequest(BaseModel):
    threat_id: int


class PlaybookExecuteResponse(BaseModel):
    playbook_id: int
    execution_status: str
    steps_completed: int


class PlaybookLogResponse(BaseModel):
    id: int
    playbook_id: int
    threat_id: int
    executed_by: str
    execution_time: float
    status: str
    log_entries: list[dict]
    created_at: datetime
