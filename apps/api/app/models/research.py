import enum
import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.users import User


class ResearchStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    PUBLISHED = "PUBLISHED"


class ResearchItem(Base, TimestampMixin):
    """Research publication / paper entity."""

    __tablename__ = "research_items"

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    abstract: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    research_area: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, index=True)
    publication_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    paper_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    status: Mapped[ResearchStatus] = mapped_column(
        Enum(ResearchStatus, name="research_status_enum", native_enum=False),
        default=ResearchStatus.PUBLISHED,
        nullable=False,
    )

    # Relationship
    owner: Mapped["User"] = relationship("User", back_populates="research_items")
