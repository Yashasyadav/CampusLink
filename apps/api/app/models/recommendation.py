import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Float, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.users import User
    from app.models.feedback import RecommendationFeedback


class RecommendationEvent(Base):
    """
    Persistent audit record of a recommendation actually surfaced to an authenticated user.
    Stores structured metadata without private resume text, tokens, or raw prompts.
    """

    __tablename__ = "recommendation_events"

    request_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    query: Mapped[str] = mapped_column(String(512), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    rank_position: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    relevance_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    evidence_quality_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    explanation_generated: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    graph_run_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User")
    feedback_records: Mapped[list["RecommendationFeedback"]] = relationship(
        "RecommendationFeedback", back_populates="recommendation_event", cascade="all, delete-orphan"
    )
