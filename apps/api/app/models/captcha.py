import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class Captcha(Base, TimestampMixin):
    """Permanent CAPTCHA master record used in backend rotation."""

    __tablename__ = "captchas"

    captcha_text: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    challenges: Mapped[list["CaptchaChallenge"]] = relationship(
        "CaptchaChallenge", back_populates="captcha", cascade="all, delete-orphan"
    )


class CaptchaChallenge(Base):
    """One-time CAPTCHA challenge issued to a login form."""

    __tablename__ = "captcha_challenges"

    challenge_token: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    captcha_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("captchas.id", ondelete="CASCADE"), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    captcha: Mapped[Captcha] = relationship("Captcha", back_populates="challenges")


class CaptchaRotationState(Base):
    """Single-row pointer for safe CAPTCHA circulation."""

    __tablename__ = "captcha_rotation_state"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    current_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
