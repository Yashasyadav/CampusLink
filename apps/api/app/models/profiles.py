import enum
import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Boolean, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.users import User


class ContactVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    CONNECTIONS_ONLY = "CONNECTIONS_ONLY"
    PRIVATE = "PRIVATE"


class Profile(Base, TimestampMixin):
    """User profile entity with privacy control boundaries."""

    __tablename__ = "profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    profile_photo_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Privacy & Visibility Controls
    searchable: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, index=True
    )
    contact_visibility: Mapped[ContactVisibility] = mapped_column(
        Enum(ContactVisibility, name="contact_visibility_enum", native_enum=False),
        default=ContactVisibility.CONNECTIONS_ONLY,
        nullable=False,
    )
    show_email: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    show_phone: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    show_social_links: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    profile_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="profile")
