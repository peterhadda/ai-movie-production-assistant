import json
import logging
import time
from collections import Counter

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import Analysis, Character, Scene, Script
from app.services import mlflow_service
from app.services.ai_service import AIServiceError, call_claude
from app.services.prompt_loader import load_prompt
from app.services.response_parser import ParseError, parse_json_response

logger = logging.getLogger(__name__)

_TOKENS = {
    "genre_detection":          400,
    "character_identification": 2000,
    "scene_summary":            400,
    "emotion_analysis":         300,
    "pacing_analysis":          500,
    "improvement_suggestions":  3000,
}


def run_full_analysis(script_id: int, db: Session) -> Analysis:
    start_time = time.time()
    script: Script | None = None
    run_id: str | None    = None

    try:
        # ── Stage 1: Load script ──────────────────────────────────────────
        script = db.get(Script, script_id)
        if script is None:
            raise ValueError(f"Script {script_id} not found.")

        script.status = "processing"
        db.flush()

        raw_text = script.raw_text or ""

        analysis = (
            db.query(Analysis)
            .filter(Analysis.script_id == script_id)
            .order_by(Analysis.id.desc())
            .first()
        )
        if analysis is None:
            raise ValueError(f"No Analysis record found for script {script_id}.")

        # Start MLflow run immediately — save run_id so crashes are traceable
        run_id = mlflow_service.start_analysis_run(script, analysis)
        if run_id:
            analysis.mlflow_run_id = run_id
            db.flush()

        total_input_tokens  = 0
        total_output_tokens = 0

        # ── Stage 2: Genre detection ──────────────────────────────────────
        logger.info("[%d] Running genre detection", script_id)
        genre_data, in_tok, out_tok = _call_and_parse(
            "genre_detection", {"SCRIPT_EXCERPT": raw_text[:3000]}
        )
        total_input_tokens  += in_tok
        total_output_tokens += out_tok
        detected_genre           = genre_data.get("primary_genre")
        detected_secondary_genre = genre_data.get("secondary_genre")

        # ── Stage 3: Character identification ────────────────────────────
        logger.info("[%d] Running character identification", script_id)
        char_data, in_tok, out_tok = _call_and_parse(
            "character_identification", {"SCRIPT_TEXT": raw_text}
        )
        total_input_tokens  += in_tok
        total_output_tokens += out_tok
        characters_raw: list[dict] = char_data.get("characters", [])

        # ── Stage 4: Scene-level analysis ────────────────────────────────
        scenes = (
            db.query(Scene)
            .filter(Scene.analysis_id == analysis.id)
            .order_by(Scene.scene_number)
            .all()
        )

        scene_summaries: list[dict] = []

        for scene in scenes:
            logger.info("[%d] Scene %d / %d", script_id, scene.scene_number, len(scenes))
            scene_text = scene.raw_text or ""
            line_count = sum(1 for ln in scene_text.splitlines() if ln.strip())

            try:
                summary_data, in_tok, out_tok = _call_and_parse(
                    "scene_summary", {"SCENE_TEXT": scene_text}
                )
                total_input_tokens  += in_tok
                total_output_tokens += out_tok

                emotion_data, in_tok, out_tok = _call_and_parse(
                    "emotion_analysis", {"SCENE_TEXT": scene_text}
                )
                total_input_tokens  += in_tok
                total_output_tokens += out_tok

                pacing_data, in_tok, out_tok = _call_and_parse(
                    "pacing_analysis", {
                        "SCENE_TEXT":     scene_text,
                        "DIALOGUE_RATIO": str(round(scene.dialogue_ratio or 0.0, 3)),
                        "LINE_COUNT":     str(line_count),
                    }
                )
                total_input_tokens  += in_tok
                total_output_tokens += out_tok

                scene.summary      = summary_data.get("summary")
                scene.emotion      = emotion_data.get("primary_emotion")
                scene.pacing_label = pacing_data.get("pacing_label")
                scene.is_slow      = scene.is_slow and (pacing_data.get("pacing_label") == "slow")

                scene_summaries.append({
                    "scene_number": scene.scene_number,
                    "summary":      summary_data.get("summary", ""),
                    "emotion":      emotion_data.get("primary_emotion", ""),
                    "pacing_label": pacing_data.get("pacing_label", ""),
                })

            except Exception as scene_exc:
                logger.error(
                    "[%d] Scene %d failed — skipping: %s",
                    script_id, scene.scene_number, scene_exc,
                )
                scene.summary = "Analysis failed for this scene."
                scene_summaries.append({
                    "scene_number": scene.scene_number,
                    "summary":      "Analysis failed for this scene.",
                    "emotion":      "",
                    "pacing_label": "",
                })

            db.flush()

        # ── Stage 5: Improvement suggestions ─────────────────────────────
        logger.info("[%d] Building improvement suggestions", script_id)
        slow_count           = sum(1 for s in scenes if s.is_slow)
        dialogue_heavy_count = sum(1 for s in scenes if s.is_dialogue_heavy)

        scene_summaries_text = "\n".join(
            f"Scene {s['scene_number']} | {s['summary']} | {s['emotion']} | {s['pacing_label']}"
            for s in scene_summaries
        )
        character_list_text = "\n".join(
            f"{c.get('name', '?')} ({c.get('role_type', '?')}) — {c.get('description', '')}"
            for c in characters_raw
        ) or "No characters identified."

        suggestions_data, in_tok, out_tok = _call_and_parse(
            "improvement_suggestions", {
                "GENRE":                detected_genre or "Unknown",
                "TOTAL_SCENES":         str(len(scenes)),
                "SLOW_SCENE_COUNT":     str(slow_count),
                "DIALOGUE_HEAVY_COUNT": str(dialogue_heavy_count),
                "SCENE_SUMMARIES":      scene_summaries_text,
                "CHARACTER_LIST":       character_list_text,
            }
        )
        total_input_tokens  += in_tok
        total_output_tokens += out_tok

        # ── Stage 6: Persist everything ───────────────────────────────────
        pacing_labels  = [s.pacing_label for s in scenes if s.pacing_label]
        overall_pacing = Counter(pacing_labels).most_common(1)[0][0] if pacing_labels else None

        analysis.detected_genre           = detected_genre
        analysis.detected_secondary_genre = detected_secondary_genre
        analysis.character_count          = len(characters_raw)
        analysis.overall_pacing_label     = overall_pacing
        analysis.improvement_suggestions  = json.dumps(suggestions_data.get("suggestions", []))
        analysis.model_used               = settings.MODEL_NAME

        db.query(Character).filter(Character.analysis_id == analysis.id).delete()
        for char in characters_raw:
            db.add(Character(
                analysis_id=analysis.id,
                name=char.get("name", "Unknown"),
                role_type=char.get("role_type"),
                description=char.get("description"),
            ))

        script.status = "complete"

        # ── Stage 7: Timing + MLflow ──────────────────────────────────────
        analysis.latency_ms = int((time.time() - start_time) * 1000)

        mlflow_service.log_scene_metrics(
            run_id,
            total_latency_ms=analysis.latency_ms,
            total_input_tokens=total_input_tokens,
            total_output_tokens=total_output_tokens,
            slow_scene_count=slow_count,
            dialogue_heavy_count=dialogue_heavy_count,
        )

        mlflow_service.log_artifacts(run_id, {
            "prompts_used.json": {
                "prompt_version": settings.PROMPT_VERSION,
                "prompts":        list(_TOKENS.keys()),
            },
            "genre_response.json":       genre_data,
            "character_response.json":   char_data,
            "suggestions_response.json": suggestions_data,
        })

        mlflow_service.end_run(run_id, "success", detected_genre or "unknown")

        db.commit()
        db.refresh(analysis)

        logger.info(
            "[%d] Complete — %d scenes, %d chars, %dms, ~$%.4f",
            script_id, len(scenes), len(characters_raw),
            analysis.latency_ms,
            (total_input_tokens / 1_000_000 * 3.0) + (total_output_tokens / 1_000_000 * 15.0),
        )
        return analysis

    except Exception as exc:
        logger.exception("[%d] run_full_analysis failed: %s", script_id, exc)
        mlflow_service.end_run(run_id, "failed", "unknown")
        if script is not None:
            try:
                script.status = "failed"
                db.commit()
            except Exception:
                db.rollback()
        raise


# ── Internal helper ───────────────────────────────────────────────────────────

def _call_and_parse(prompt_name: str, variables: dict) -> tuple[dict, int, int]:
    """Returns (parsed_dict, input_tokens, output_tokens)."""
    prompt     = load_prompt(prompt_name, settings.PROMPT_VERSION, variables)
    max_tokens = _TOKENS.get(prompt_name, 1000)

    try:
        raw_text, in_tok, out_tok = call_claude(prompt, max_tokens=max_tokens)
    except AIServiceError:
        logger.exception("AI call failed for prompt '%s'", prompt_name)
        raise

    try:
        return parse_json_response(raw_text), in_tok, out_tok
    except ParseError:
        logger.exception("JSON parse failed for prompt '%s'", prompt_name)
        raise
