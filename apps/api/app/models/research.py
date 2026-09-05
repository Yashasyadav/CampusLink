import enum
import uuid
from datetime import date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Date, Integer, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.users import User


class PublicationType(str, enum.Enum):
    JOURNAL = "JOURNAL"
    JOURNAL_ARTICLE = "JOURNAL_ARTICLE"
    CONFERENCE = "CONFERENCE"
    WORKSHOP = "WORKSHOP"
    THESIS = "THESIS"
    DISSERTATION = "DISSERTATION"
    PREPRINT = "PREPRINT"
    TECHNICAL_REPORT = "TECHNICAL_REPORT"
    OTHER = "OTHER"


class ResearchVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    CAMPUS_ONLY = "CAMPUS_ONLY"
    PRIVATE = "PRIVATE"


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
    publication_type: Mapped[PublicationType] = mapped_column(
        Enum(PublicationType, name="publication_type_enum", native_enum=False),
        default=PublicationType.JOURNAL,
        nullable=False,
        index=True,
    )
    publication_venue: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    publication_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    doi: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    publication_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    paper_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    status: Mapped[ResearchStatus] = mapped_column(
        Enum(ResearchStatus, name="research_status_enum", native_enum=False),
        default=ResearchStatus.PUBLISHED,
        nullable=False,
        index=True,
    )
    visibility: Mapped[ResearchVisibility] = mapped_column(
        Enum(ResearchVisibility, name="research_visibility_enum", native_enum=False),
        default=ResearchVisibility.CAMPUS_ONLY,
        nullable=False,
        index=True,
    )
    provenance: Mapped[str] = mapped_column(String(50), default="MANUAL", nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="research_items")
    authors: Mapped[List["ResearchAuthor"]] = relationship(
        "ResearchAuthor", back_populates="research", cascade="all, delete-orphan"
    )


class ResearchAuthor(Base, TimestampMixin):
    """Research paper author junction relationship."""

    __tablename__ = "research_authors"
    __table_args__ = (
        UniqueConstraint("research_id", "user_id", name="uq_research_author"),
    )

    research_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("research_items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_order: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    research: Mapped["ResearchItem"] = relationship("ResearchItem", back_populates="authors")
    user: Mapped["User"] = relationship("User")

