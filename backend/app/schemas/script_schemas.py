from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class ScriptUploadRequest(BaseModel):
    text: Optional[str] = None
    title: Optional[str] = None
    genre_hint: Optional[str] = None
    target_audience: Optional[str] = None
    production_style: Optional[str] = None


class SceneResponse(BaseModel):
    scene_number: int
    scene_header: str
    line_count: int
    dialogue_ratio: float
    is_slow: bool
    is_dialogue_heavy: bool
    raw_text: str

    @field_validator("raw_text", mode="before")
    @classmethod
    def truncate_raw_text(cls, v: str) -> str:
        return (v or "")[:200]

    model_config = {"from_attributes": True}


class ScriptResponse(BaseModel):
    id: int
    title: Optional[str]
    status: str
    s3_key: Optional[str]
    created_at: datetime
    scenes: list[SceneResponse] = []

    model_config = {"from_attributes": True}


class ScriptSummary(BaseModel):
    id: int
    title: Optional[str]
    status: str
    created_at: datetime
    scene_count: Optional[int]

    model_config = {"from_attributes": True}


class StatusResponse(BaseModel):
    job_id: int
    status: str
    scene_count: Optional[int] = None
