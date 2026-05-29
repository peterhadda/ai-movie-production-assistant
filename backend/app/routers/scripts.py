import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, get_db
from app.models.models import Analysis, Character, Scene, Script
from app.schemas.script_schemas import (
    CharacterResponse,
    SceneResponse,
    ScriptResponse,
    ScriptSummary,
    StatusResponse,
    SuggestionItem,
)
from app.services import mlflow_service, s3_service
from app.services.scene_parser import parse_scenes

logger = logging.getLogger(__name__)
router = APIRouter()


class RatingRequest(BaseModel):
    score: float = Field(..., ge=1.0, le=5.0)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _run_analysis_background(script_id: int) -> None:
    """Wrapper that owns its own DB session so FastAPI's request session is not shared."""
    if SessionLocal is None:
        logger.error("Cannot run analysis — database not configured.")
        return
    from app.services.analysis_service import run_full_analysis
    db = SessionLocal()
    try:
        run_full_analysis(script_id, db)
    except Exception:
        logger.exception("Background analysis failed for script %d", script_id)
    finally:
        db.close()


# ── Upload ────────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=StatusResponse)
async def upload_script(
    text: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    genre_hint: Optional[str] = Form(None),
    target_audience: Optional[str] = Form(None),
    production_style: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    if file is not None:
        raw_bytes = await file.read()
        raw_text = raw_bytes.decode("utf-8", errors="replace")
    elif text:
        raw_text = text
    else:
        raise HTTPException(status_code=422, detail="Provide either 'text' or a file upload.")

    script_title = title or f"Script_{datetime.now(timezone.utc).strftime('%Y%m%d')}_{uuid.uuid4().hex[:6]}"

    s3_key: Optional[str] = None
    try:
        s3_key = s3_service.upload_script(raw_text, f"{uuid.uuid4().hex}.txt")
    except Exception:
        pass

    script = Script(
        title=script_title,
        s3_key=s3_key,
        raw_text=raw_text,
        genre_hint=genre_hint,
        target_audience=target_audience,
        production_style=production_style,
        status="pending",
        created_at=_utcnow(),
    )
    db.add(script)
    db.flush()

    parsed     = parse_scenes(raw_text)
    scene_count = len(parsed)

    analysis = Analysis(
        script_id=script.id,
        scene_count=scene_count,
        created_at=_utcnow(),
    )
    db.add(analysis)
    db.flush()

    for p in parsed:
        db.add(Scene(
            analysis_id=analysis.id,
            scene_number=p["scene_number"],
            scene_header=p["scene_header"],
            raw_text=p["raw_text"],
            dialogue_ratio=p["dialogue_ratio"],
            is_slow=p["is_slow"],
            is_dialogue_heavy=p["is_dialogue_heavy"],
        ))

    db.commit()
    return StatusResponse(job_id=script.id, status="pending", scene_count=scene_count)


# ── Trigger AI analysis ───────────────────────────────────────────────────────

@router.post("/{script_id}/analyze", response_model=StatusResponse)
def analyze_script(
    script_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    script = db.get(Script, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found.")
    if script.status == "processing":
        raise HTTPException(status_code=400, detail="Analysis is already in progress.")

    background_tasks.add_task(_run_analysis_background, script_id)

    return StatusResponse(
        job_id=script_id,
        status="processing",
        message="Analysis started.",
    )


# ── Get single script ─────────────────────────────────────────────────────────

@router.get("/{script_id}", response_model=ScriptResponse)
def get_script(script_id: int, db: Session = Depends(get_db)):
    script = db.get(Script, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found.")

    analysis: Optional[Analysis] = script.analyses[0] if script.analyses else None

    detected_genre           = analysis.detected_genre           if analysis else None
    detected_secondary_genre = analysis.detected_secondary_genre if analysis else None

    suggestions: list[SuggestionItem] = []
    if analysis and analysis.improvement_suggestions:
        try:
            raw_list = json.loads(analysis.improvement_suggestions)
            suggestions = [SuggestionItem(**item) for item in raw_list if isinstance(item, dict)]
        except Exception:
            suggestions = []

    characters: list[CharacterResponse] = [
        CharacterResponse(name=c.name, role_type=c.role_type, description=c.description)
        for c in (analysis.characters if analysis else [])
    ]

    scenes: list[SceneResponse] = []
    for scene in sorted(analysis.scenes if analysis else [], key=lambda s: s.scene_number):
        line_count = sum(1 for ln in (scene.raw_text or "").splitlines() if ln.strip())
        scenes.append(SceneResponse(
            scene_number=scene.scene_number,
            scene_header=scene.scene_header or "",
            line_count=line_count,
            dialogue_ratio=scene.dialogue_ratio or 0.0,
            is_slow=scene.is_slow,
            is_dialogue_heavy=scene.is_dialogue_heavy,
            raw_text=scene.raw_text or "",
            summary=scene.summary,
            emotion=scene.emotion,
            pacing_label=scene.pacing_label,
        ))

    return ScriptResponse(
        id=script.id,
        title=script.title,
        status=script.status,
        s3_key=script.s3_key,
        created_at=script.created_at,
        detected_genre=detected_genre,
        detected_secondary_genre=detected_secondary_genre,
        scenes=scenes,
        characters=characters,
        improvement_suggestions=suggestions,
    )


# ── Status poll ───────────────────────────────────────────────────────────────

@router.get("/{script_id}/status", response_model=StatusResponse)
def get_script_status(script_id: int, db: Session = Depends(get_db)):
    script = db.get(Script, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found.")

    scene_count = script.analyses[0].scene_count if script.analyses else None
    return StatusResponse(job_id=script.id, status=script.status, scene_count=scene_count)


# ── Rate analysis quality ─────────────────────────────────────────────────────

@router.post("/{script_id}/rate")
def rate_analysis(script_id: int, body: RatingRequest, db: Session = Depends(get_db)):
    script = db.get(Script, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found.")

    analysis: Optional[Analysis] = script.analyses[0] if script.analyses else None
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found for this script.")

    mlflow_service.update_quality_score(analysis.mlflow_run_id, body.score)
    return {"status": "ok", "score": body.score}


# ── List all scripts ──────────────────────────────────────────────────────────

@router.get("/", response_model=list[ScriptSummary])
def list_scripts(db: Session = Depends(get_db)):
    scripts = db.query(Script).order_by(Script.created_at.desc()).all()
    return [
        ScriptSummary(
            id=s.id,
            title=s.title,
            status=s.status,
            created_at=s.created_at,
            scene_count=s.analyses[0].scene_count if s.analyses else None,
        )
        for s in scripts
    ]
