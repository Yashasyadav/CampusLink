import uuid
from typing import Optional, Any, Dict
from sqlalchemy import String, Text, Integer, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector
from app.models.base import Base, TimestampMixin

EMBEDDING_DIMENSION = 768  # Configurable embedding dimension (default for Gemini text-embedding-004)


class Embedding(Base, TimestampMixin):
    """Polymorphic entity vector embedding entity for pgvector semantic search."""

    __tablename__ = "embeddings"
    __table_args__ = (
        Index("ix_embeddings_entity", "entity_type", "entity_id"),
    )

    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list] = mapped_column(Vector(EMBEDDING_DIMENSION), nullable=False)
    embedding_model: Mapped[str] = mapped_column(
        String(100), default="text-embedding-004", nullable=False
    )
    chunk_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    metadata_: Mapped[Optional[Dict[str, Any]]] = mapped_column("metadata", JSONB, nullable=True)
