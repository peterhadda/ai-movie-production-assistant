from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Script(Base):
    __tablename__ = "scripts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str | None] = mapped_column(String(255))
    s3_key: Mapped[str | None] = mapped_column(String(512))
    raw_text: Mapped[str | None] = mapped_column(Text)
    genre_hint: Mapped[str | None] = mapped_column(String(100))
    target_audience: Mapped[str | None] = mapped_column(String(100))
    production_style: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    analyses: Mapped[list["Analysis"]] = relationship("Analysis", back_populates="script")


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    script_id: Mapped[int] = mapped_column(ForeignKey("scripts.id"), nullable=False, index=True)
    detected_genre: Mapped[str | None] = mapped_column(String(100))
    detected_secondary_genre: Mapped[str | None] = mapped_column(String(100))
    scene_count: Mapped[int | None] = mapped_column(Integer)
    character_count: Mapped[int | None] = mapped_column(Integer)
    overall_pacing_label: Mapped[str | None] = mapped_column(String(50))
    improvement_suggestions: Mapped[str | None] = mapped_column(Text)
    mlflow_run_id: Mapped[str | None] = mapped_column(String(255))
    model_used: Mapped[str | None] = mapped_column(String(100))
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    script: Mapped["Script"] = relationship("Script", back_populates="analyses")
    scenes: Mapped[list["Scene"]] = relationship("Scene", back_populates="analysis")
    characters: Mapped[list["Character"]] = relationship("Character", back_populates="analysis")


class Scene(Base):
    __tablename__ = "scenes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id"), nullable=False, index=True)
    scene_number: Mapped[int] = mapped_column(Integer, nullable=False)
    scene_header: Mapped[str | None] = mapped_column(String(500))
    raw_text: Mapped[str | None] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text)
    emotion: Mapped[str | None] = mapped_column(String(100))
    pacing_label: Mapped[str | None] = mapped_column(String(50))
    dialogue_ratio: Mapped[float | None] = mapped_column(Float)
    is_slow: Mapped[bool] = mapped_column(Boolean, default=False)
    is_dialogue_heavy: Mapped[bool] = mapped_column(Boolean, default=False)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="scenes")


class Character(Base):
    __tablename__ = "characters"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role_type: Mapped[str | None] = mapped_column(String(50))
    description: Mapped[str | None] = mapped_column(Text)

    analysis: Mapped["Analysis"] = relationship("Analysis", back_populates="characters")
