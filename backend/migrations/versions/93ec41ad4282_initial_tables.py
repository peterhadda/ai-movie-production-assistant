"""initial tables

Revision ID: 93ec41ad4282
Revises:
Create Date: 2026-05-28 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "93ec41ad4282"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "scripts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("s3_key", sa.String(length=512), nullable=True),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("genre_hint", sa.String(length=100), nullable=True),
        sa.Column("target_audience", sa.String(length=100), nullable=True),
        sa.Column("production_style", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "analyses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("script_id", sa.Integer(), nullable=False),
        sa.Column("detected_genre", sa.String(length=100), nullable=True),
        sa.Column("detected_secondary_genre", sa.String(length=100), nullable=True),
        sa.Column("scene_count", sa.Integer(), nullable=True),
        sa.Column("character_count", sa.Integer(), nullable=True),
        sa.Column("overall_pacing_label", sa.String(length=50), nullable=True),
        sa.Column("improvement_suggestions", sa.Text(), nullable=True),
        sa.Column("mlflow_run_id", sa.String(length=255), nullable=True),
        sa.Column("model_used", sa.String(length=100), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["script_id"], ["scripts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_analyses_script_id", "analyses", ["script_id"])

    op.create_table(
        "scenes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("analysis_id", sa.Integer(), nullable=False),
        sa.Column("scene_number", sa.Integer(), nullable=False),
        sa.Column("scene_header", sa.String(length=500), nullable=True),
        sa.Column("raw_text", sa.Text(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("emotion", sa.String(length=100), nullable=True),
        sa.Column("pacing_label", sa.String(length=50), nullable=True),
        sa.Column("dialogue_ratio", sa.Float(), nullable=True),
        sa.Column("is_slow", sa.Boolean(), nullable=False),
        sa.Column("is_dialogue_heavy", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["analysis_id"], ["analyses.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_scenes_analysis_id", "scenes", ["analysis_id"])

    op.create_table(
        "characters",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("analysis_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("role_type", sa.String(length=50), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["analysis_id"], ["analyses.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_characters_analysis_id", "characters", ["analysis_id"])


def downgrade() -> None:
    op.drop_index("ix_characters_analysis_id", table_name="characters")
    op.drop_table("characters")
    op.drop_index("ix_scenes_analysis_id", table_name="scenes")
    op.drop_table("scenes")
    op.drop_index("ix_analyses_script_id", table_name="analyses")
    op.drop_table("analyses")
    op.drop_table("scripts")
