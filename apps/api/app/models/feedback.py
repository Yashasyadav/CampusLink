import enum
import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.users import User
    from app.models.recommendation import RecommendationEvent


class FeedbackType(str, enum.Enum):
    HELPFUL = "HELPFUL"
    NOT_HELPFUL = "NOT_HELPFUL"
    PARTIALLY_HELPFUL = "PARTIALLY_HELPFUL"
    WRONG_MATCH = "WRONG_MATCH"
    OUTDATED = "OUTDATED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


class RecommendationFeedback(Base):
    """
    Structured user feedback record for a surfaced recommendation event.
    Tied strictly to the authenticated user with uniqueness constraint to allow updatable feedback.
    """

    __tablename__ = "recommendation_feedback"
    __table_args__ = (
        UniqueConstraint("recommendation_event_id", "user_id", name="uq_rec_event_user_feedback"),
    )

    recommendation_event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recommendation_events.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    feedback_type: Mapped[FeedbackType] = mapped_column(
        Enum(FeedbackType, name="feedback_type_enum", native_enum=False),
        nullable=False,
        index=True,
    )
    comment: Mapped[Optional[str]] = mapped_column("optional_comment", Text, nullable=True)

    @property
    def optional_comment(self) -> Optional[str]:
        return self.comment

    @optional_comment.setter
    def optional_comment(self, value: Optional[str]):
        self.comment = value
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User")
    recommendation_event: Mapped["RecommendationEvent"] = relationship(
        "RecommendationEvent", back_populates="feedback_records"
    )
