import json
import logging
import os
import shutil
import tempfile
from typing import Any

import mlflow
from mlflow import MlflowClient

from app.core.config import settings
from app.models.models import Analysis, Script

logger = logging.getLogger(__name__)

_EXPERIMENT_NAME = "script-analysis"


def setup_experiment() -> None:
    """Set tracking URI and ensure the experiment exists. Call once on app startup."""
    try:
        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
        mlflow.set_experiment(_EXPERIMENT_NAME)
        logger.info(
            "MLflow experiment '%s' ready at %s",
            _EXPERIMENT_NAME, settings.MLFLOW_TRACKING_URI,
        )
    except Exception:
        logger.exception("MLflow setup failed — tracking will be skipped for this session")


def start_analysis_run(script: Script, analysis: Analysis) -> str | None:
    """Open a new MLflow run, log parameters, return the run_id (or None if MLflow is down)."""
    try:
        mlflow.set_tracking_uri(settings.MLFLOW_TRACKING_URI)
        client = MlflowClient()

        exp = client.get_experiment_by_name(_EXPERIMENT_NAME)
        exp_id = exp.experiment_id if exp else client.create_experiment(_EXPERIMENT_NAME)

        run = client.create_run(
            experiment_id=exp_id,
            tags={
                "script_id":   str(script.id),
                "analysis_id": str(analysis.id),
            },
        )
        run_id = run.info.run_id

        client.log_param(run_id, "prompt_version",   settings.PROMPT_VERSION)
        client.log_param(run_id, "model_name",       settings.MODEL_NAME)
        client.log_param(run_id, "scene_count",      str(analysis.scene_count or 0))
        client.log_param(run_id, "genre_hint",       script.genre_hint       or "none")
        client.log_param(run_id, "target_audience",  script.target_audience  or "none")
        client.log_param(run_id, "production_style", script.production_style or "none")

        return run_id

    except Exception:
        logger.exception("Could not start MLflow run for script %d — continuing without tracking", script.id)
        return None


def log_scene_metrics(
    run_id: str | None,
    total_latency_ms: int,
    total_input_tokens: int,
    total_output_tokens: int,
    slow_scene_count: int,
    dialogue_heavy_count: int,
) -> None:
    """Log aggregate pipeline metrics to an existing run."""
    if not run_id:
        return
    try:
        cost_usd = (total_input_tokens / 1_000_000 * 3.0) + (total_output_tokens / 1_000_000 * 15.0)
        client   = MlflowClient()
        metrics  = {
            "total_latency_ms":     total_latency_ms,
            "total_input_tokens":   total_input_tokens,
            "total_output_tokens":  total_output_tokens,
            "estimated_cost_usd":   round(cost_usd, 6),
            "slow_scene_count":     slow_scene_count,
            "dialogue_heavy_count": dialogue_heavy_count,
        }
        for key, value in metrics.items():
            client.log_metric(run_id, key, value)
    except Exception:
        logger.exception("Failed to log scene metrics to MLflow run %s", run_id)


def log_artifacts(run_id: str | None, artifacts: dict[str, Any]) -> None:
    """Serialize each artifact to a temp file, log to MLflow (→ S3), then clean up."""
    if not run_id:
        return
    tmp_dir = tempfile.mkdtemp()
    try:
        client = MlflowClient()
        for filename, content in artifacts.items():
            path = os.path.join(tmp_dir, filename)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(content, f, indent=2, ensure_ascii=False)
            client.log_artifact(run_id, path)
    except Exception:
        logger.exception("Failed to log artifacts to MLflow run %s", run_id)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def end_run(run_id: str | None, status: str, detected_genre: str) -> None:
    """Tag and close an MLflow run. status should be 'success' or 'failed'."""
    if not run_id:
        return
    try:
        client        = MlflowClient()
        mlflow_status = "FINISHED" if status == "success" else "FAILED"
        client.set_tag(run_id, "status",         status)
        client.set_tag(run_id, "detected_genre", detected_genre)
        client.set_terminated(run_id, mlflow_status)
    except Exception:
        logger.exception("Failed to end MLflow run %s", run_id)


def update_quality_score(run_id: str | None, score: float) -> None:
    """Retroactively add a user-provided quality score to a completed run."""
    if not run_id:
        return
    try:
        MlflowClient().log_metric(run_id, "quality_score", score)
    except Exception:
        logger.exception("Failed to log quality score to MLflow run %s", run_id)
