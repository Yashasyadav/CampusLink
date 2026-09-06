"""004_recommendation_feedback

Revision ID: 004_recommendation_feedback
Revises: 003_semantic_search
Create Date: 2026-09-06 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '004_recommendation_feedback'
down_revision: Union[str, None] = '003_semantic_search'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create recommendation_events table
    op.create_table(
        'recommendation_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('request_id', sa.String(length=64), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('query', sa.String(length=512), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rank_position', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('relevance_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('evidence_quality_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('explanation_generated', sa.Text(), nullable=True),
        sa.Column('graph_run_id', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index(op.f('ix_recommendation_events_request_id'), 'recommendation_events', ['request_id'], unique=False)
    op.create_index(op.f('ix_recommendation_events_user_id'), 'recommendation_events', ['user_id'], unique=False)
    op.create_index(op.f('ix_recommendation_events_entity_type'), 'recommendation_events', ['entity_type'], unique=False)
    op.create_index(op.f('ix_recommendation_events_entity_id'), 'recommendation_events', ['entity_id'], unique=False)
    op.create_index(op.f('ix_recommendation_events_created_at'), 'recommendation_events', ['created_at'], unique=False)
    op.create_index('ix_rec_events_entity_composite', 'recommendation_events', ['entity_type', 'entity_id'], unique=False)

    # 2. Create recommendation_feedback table
    op.create_table(
        'recommendation_feedback',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('recommendation_event_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('recommendation_events.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('feedback_type', sa.String(length=50), nullable=False),
        sa.Column('optional_comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.UniqueConstraint('recommendation_event_id', 'user_id', name='uq_rec_event_user_feedback'),
    )
    op.create_index(op.f('ix_recommendation_feedback_recommendation_event_id'), 'recommendation_feedback', ['recommendation_event_id'], unique=False)
    op.create_index(op.f('ix_recommendation_feedback_user_id'), 'recommendation_feedback', ['user_id'], unique=False)
    op.create_index(op.f('ix_recommendation_feedback_feedback_type'), 'recommendation_feedback', ['feedback_type'], unique=False)
    op.create_index(op.f('ix_recommendation_feedback_created_at'), 'recommendation_feedback', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_table('recommendation_feedback')
    op.drop_table('recommendation_events')
