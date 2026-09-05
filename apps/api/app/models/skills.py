import enum
import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Float, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.users import User
    from app.models.projects import ProjectSkill


class ProficiencyLevel(str, enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"


class SkillSource(str, enum.Enum):
    USER = "USER"
    RESUME = "RESUME"
    PROJECT = "PROJECT"
    ADMIN = "ADMIN"
    AI_EXTRACTION = "AI_EXTRACTION"


class Skill(Base, TimestampMixin):
    """Normalized Skill taxonomy entity."""

    __tablename__ = "skills"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    normalized_name: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)

    # Relationships
    user_skills: Mapped[List["UserSkill"]] = relationship(
        "UserSkill", back_populates="skill", cascade="all, delete-orphan"
    )
    project_skills: Mapped[List["ProjectSkill"]] = relationship(
        "ProjectSkill", back_populates="skill", cascade="all, delete-orphan"
    )


class UserSkill(Base, TimestampMixin):
    """User-to-Skill many-to-many relationship with metadata."""

    __tablename__ = "user_skills"
    __table_args__ = (
        UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True
    )
    proficiency: Mapped[ProficiencyLevel] = mapped_column(
        Enum(ProficiencyLevel, name="proficiency_level_enum", native_enum=False),
        default=ProficiencyLevel.BEGINNER,
        nullable=False,
    )
    source: Mapped[SkillSource] = mapped_column(
        Enum(SkillSource, name="skill_source_enum", native_enum=False),
        default=SkillSource.USER,
        nullable=False,
    )
    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="user_skills")
