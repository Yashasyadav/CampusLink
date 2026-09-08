"""005_captcha_challenges

Revision ID: 005_captcha_challenges
Revises: 004_recommendation_feedback
Create Date: 2026-09-07 00:00:00.000000

"""
from typing import Sequence, Union
import uuid
from datetime import datetime, timezone
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "005_captcha_challenges"
down_revision: Union[str, None] = "004_recommendation_feedback"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


CAPTCHA_VALUES = [
    "K7P4X",
    "M9Q2R",
    "T5N8A",
    "B6Y3K",
    "H8D2P",
    "W4F7M",
    "C9R5T",
    "X3K8N",
    "P6A4Z",
    "R7M2Q",
]


def upgrade() -> None:
    op.create_table(
        "captchas",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("captcha_text", sa.String(length=20), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.UniqueConstraint("captcha_text", name=op.f("uq_captchas_captcha_text")),
        sa.UniqueConstraint("order_index", name=op.f("uq_captchas_order_index")),
    )
    op.create_index(op.f("ix_captchas_is_active"), "captchas", ["is_active"], unique=False)
    op.create_index(op.f("ix_captchas_order_index"), "captchas", ["order_index"], unique=True)

    op.create_table(
        "captcha_rotation_state",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("current_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )

    op.create_table(
        "captcha_challenges",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("challenge_token", sa.String(length=128), nullable=False),
        sa.Column("captcha_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["captcha_id"], ["captchas.id"], name=op.f("fk_captcha_challenges_captcha_id_captchas"), ondelete="CASCADE"),
        sa.UniqueConstraint("challenge_token", name=op.f("uq_captcha_challenges_challenge_token")),
    )
    op.create_index(op.f("ix_captcha_challenges_challenge_token"), "captcha_challenges", ["challenge_token"], unique=True)
    op.create_index(op.f("ix_captcha_challenges_expires_at"), "captcha_challenges", ["expires_at"], unique=False)
    op.create_index(op.f("ix_captcha_challenges_used_at"), "captcha_challenges", ["used_at"], unique=False)

    captchas_table = sa.table(
        "captchas",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("captcha_text", sa.String),
        sa.column("order_index", sa.Integer),
        sa.column("is_active", sa.Boolean),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    now = datetime.now(timezone.utc)
    op.bulk_insert(
        captchas_table,
        [
            {
                "id": uuid.uuid4(),
                "captcha_text": value,
                "order_index": index,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
            for index, value in enumerate(CAPTCHA_VALUES, start=1)
        ],
    )

    op.execute(
        """
        INSERT INTO captcha_rotation_state (id, current_index, updated_at)
        VALUES (1, 0, NOW())
        ON CONFLICT (id) DO NOTHING
        """
    )


def downgrade() -> None:
    op.drop_table("captcha_challenges")
    op.drop_table("captcha_rotation_state")
    op.drop_table("captchas")
