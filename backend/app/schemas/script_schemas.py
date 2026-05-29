from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, field_validator


class ScriptUploadRequest(BaseModel):
    text: Optional[str] = None
    title: Optional[str] = None
    genre_hint: Optional[str] = None
    target_audience: Optional[str] = None
    production_style: Optional[str] = None


class CharacterResponse(BaseModel):
    name: str
    role_type: Optional[str] = None
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class SuggestionItem(BaseModel):
    type: str
    severity: str
    scene_reference: Optional[int] = None
    suggestion: str
    example: str

    model_config = {"from_attributes": True}


class SceneResponse(BaseModel):
    scene_number: int
    scene_header: Optional[str] = None
    line_count: int
    dialogue_ratio: float
    is_slow: bool
    is_dialogue_heavy: bool
    raw_text: str
    summary: Optional[str] = None
    emotion: Optional[str] = None
    pacing_label: Optional[str] = None

    @field_validator("raw_text", mode="before")
    @classmethod
    def truncate_raw_text(cls, v: Any) -> str:
        return (v or "")[:200]

    model_config = {"from_attributes": True}


class ScriptResponse(BaseModel):
    id: int
    title: Optional[str] = None
    status: str
    s3_key: Optional[str] = None
    created_at: datetime
    detected_genre: Optional[str] = None
    detected_secondary_genre: Optional[str] = None
    scenes: list[SceneResponse] = []
    characters: list[CharacterResponse] = []
    improvement_suggestions: list[SuggestionItem] = []

    model_config = {"from_attributes": True}


class ScriptSummary(BaseModel):
    id: int
    title: Optional[str] = None
    status: str
    created_at: datetime
    scene_count: Optional[int] = None

    model_config = {"from_attributes": True}


class StatusResponse(BaseModel):
    job_id: int
    status: str
    scene_count: Optional[int] = None
    message: Optional[str] = None
