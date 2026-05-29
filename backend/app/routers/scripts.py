import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Analysis, Character, Scene, Script
from app.schemas.script_schemas import (
    SceneResponse,
    ScriptResponse,
    ScriptSummary,
    StatusResponse,
)
from app.services import s3_service
from app.services.scene_parser import parse_scenes

router = APIRouter()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


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
    # 1. Read script text
    if file is not None:
        raw_bytes = await file.read()
        raw_text = raw_bytes.decode("utf-8", errors="replace")
    elif text:
        raw_text = text
    else:
        raise HTTPException(status_code=422, detail="Provide either 'text' or a file upload.")

    # 2. Title fallback
    script_title = title or f"Script_{datetime.now(timezone.utc).strftime('%Y%m%d')}_{uuid.uuid4().hex[:6]}"

    # 3. Upload to S3 (best-effort — continues without S3 if bucket not configured)
    s3_key: Optional[str] = None
    try:
        filename = f"{uuid.uuid4().hex}.txt"
        s3_key = s3_service.upload_script(raw_text, filename)
    except Exception:
        pass

    # 4. Persist Script row
    script = Script(
        title=script_title,
        s3_key=s3_key,
        raw_text=raw_text,
        genre_hint=genre_hint,
        target_audience=target_audience,
        production_style=production_style,
        status="processing",
        created_at=_utcnow(),
    )
    db.add(script)
    db.flush()  # get script.id before committing

    # 5. Parse scenes
    parsed = parse_scenes(raw_text)
    scene_count = len(parsed)

    # 6. Create bare Analysis record
    analysis = Analysis(
        script_id=script.id,
        scene_count=scene_count,
        character_count=None,
        created_at=_utcnow(),
    )
    db.add(analysis)
    db.flush()  # get analysis.id

    # 7. Create Scene rows linked to analysis
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

    # 8. Mark complete
    script.status = "complete"
    db.commit()

    return StatusResponse(job_id=script.id, status="complete", scene_count=scene_count)


@router.get("/{script_id}", response_model=ScriptResponse)
def get_script(script_id: int, db: Session = Depends(get_db)):
    script = db.get(Script, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    scenes: list[SceneResponse] = []
    for analysis in script.analyses:
        for scene in analysis.scenes:
            line_count = sum(1 for l in (scene.raw_text or "").splitlines() if l.strip())
            scenes.append(SceneResponse(
                scene_number=scene.scene_number,
                scene_header=scene.scene_header,
                line_count=line_count,
                dialogue_ratio=scene.dialogue_ratio or 0.0,
                is_slow=scene.is_slow,
                is_dialogue_heavy=scene.is_dialogue_heavy,
                raw_text=scene.raw_text or "",
            ))

    scenes.sort(key=lambda s: s.scene_number)

    return ScriptResponse(
        id=script.id,
        title=script.title,
        status=script.status,
        s3_key=script.s3_key,
        created_at=script.created_at,
        scenes=scenes,
    )


@router.get("/{script_id}/status", response_model=StatusResponse)
def get_script_status(script_id: int, db: Session = Depends(get_db)):
    script = db.get(Script, script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")

    scene_count = None
    if script.analyses:
        scene_count = script.analyses[0].scene_count

    return StatusResponse(job_id=script.id, status=script.status, scene_count=scene_count)


@router.get("/", response_model=list[ScriptSummary])
def list_scripts(db: Session = Depends(get_db)):
    scripts = db.query(Script).order_by(Script.created_at.desc()).all()
    result = []
    for s in scripts:
        scene_count = s.analyses[0].scene_count if s.analyses else None
        result.append(ScriptSummary(
            id=s.id,
            title=s.title,
            status=s.status,
            created_at=s.created_at,
            scene_count=scene_count,
        ))
    return result
