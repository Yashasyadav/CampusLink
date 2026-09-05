import enum
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Text, ForeignKey, Enum, DateTime, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.users import User


class ConnectionStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class Connection(Base, TimestampMixin):
    """Connection request entity between campus users."""

    __tablename__ = "connections"
    __table_args__ = (
        CheckConstraint("requester_id <> recipient_id", name="ck_no_self_connection"),
        UniqueConstraint("requester_id", "recipient_id", name="uq_connection_pair"),
    )

    requester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    recipient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ConnectionStatus] = mapped_column(
        Enum(ConnectionStatus, name="connection_status_enum", native_enum=False),
        default=ConnectionStatus.PENDING,
        nullable=False,
        index=True,
    )
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    requester: Mapped["User"] = relationship(
        "User", back_populates="sent_connections", foreign_keys=[requester_id]
    )
    recipient: Mapped["User"] = relationship(
        "User", back_populates="received_connections", foreign_keys=[recipient_id]
    )
