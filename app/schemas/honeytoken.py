from datetime import datetime

from pydantic import BaseModel, Field


class HoneytokenCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    token_type: str = Field(min_length=1, max_length=60)
    token_value: str = Field(min_length=1, max_length=500)
    deployed_location: str = Field(min_length=1, max_length=250)


class HoneytokenResponse(BaseModel):
    id: int
    name: str
    token_type: str
    token_value: str
    deployed_location: str
    status: str
    triggered_at: datetime | None
    created_at: datetime


class HoneytokenValidateRequest(BaseModel):
    token_value: str
    source_ip: str
    context: dict | None = None
