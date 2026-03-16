from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PlaybookCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=500)
    steps: list[dict[str, Any]] = Field(min_length=1)


class PlaybookUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, min_length=1, max_length=500)
    steps: list[dict[str, Any]] | None = Field(default=None, min_length=1)


class PlaybookResponse(BaseModel):
    id: int
    name: str
    description: str
    steps: list[dict[str, Any]]
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
