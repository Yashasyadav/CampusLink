"""003_semantic_search

Revision ID: 003_semantic_search
Revises: 002_campus_knowledge
Create Date: 2026-09-06 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_semantic_search'
down_revision: Union[str, None] = '002_campus_knowledge'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add content_hash column to embeddings table
    op.add_column('embeddings', sa.Column('content_hash', sa.String(length=64), nullable=True))
    op.create_index(op.f('ix_embeddings_content_hash'), 'embeddings', ['content_hash'], unique=False)

    # 2. Create HNSW index on vector column for fast cosine distance lookups
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_embeddings_vector_hnsw ON embeddings USING hnsw (embedding vector_cosine_ops);"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_embeddings_vector_hnsw;")
    op.drop_index(op.f('ix_embeddings_content_hash'), table_name='embeddings')
    op.drop_column('embeddings', 'content_hash')
