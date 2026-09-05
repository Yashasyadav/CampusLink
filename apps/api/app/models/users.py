import enum
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.profiles import Profile
    from app.models.skills import UserSkill
    from app.models.projects import Project, ProjectContributor
    from app.models.documents import Document
    from app.models.research import ResearchItem
    from app.models.knowledge import ProblemSolution
    from app.models.connections import Connection
    from app.models.audit import AuditLog


class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    FACULTY = "FACULTY"
    ADMIN = "ADMIN"
    ALUMNI = "ALUMNI"


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"
    PENDING = "PENDING"


class User(Base, TimestampMixin):
    """User account entity."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role_enum", native_enum=False),
        default=UserRole.STUDENT,
        nullable=False,
        index=True,
    )
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status_enum", native_enum=False),
        default=UserStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    profile: Mapped[Optional["Profile"]] = relationship(
        "Profile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    user_skills: Mapped[List["UserSkill"]] = relationship(
        "UserSkill", back_populates="user", cascade="all, delete-orphan"
    )
    created_projects: Mapped[List["Project"]] = relationship(
        "Project", back_populates="creator", foreign_keys="Project.created_by"
    )
    project_contributions: Mapped[List["ProjectContributor"]] = relationship(
        "ProjectContributor", back_populates="user", cascade="all, delete-orphan"
    )
    documents: Mapped[List["Document"]] = relationship(
        "Document", back_populates="owner", cascade="all, delete-orphan"
    )
    research_items: Mapped[List["ResearchItem"]] = relationship(
        "ResearchItem", back_populates="owner", cascade="all, delete-orphan"
    )
    problem_solutions: Mapped[List["ProblemSolution"]] = relationship(
        "ProblemSolution", back_populates="author"
    )
    sent_connections: Mapped[List["Connection"]] = relationship(
        "Connection",
        back_populates="requester",
        foreign_keys="Connection.requester_id",
        cascade="all, delete-orphan",
    )
    received_connections: Mapped[List["Connection"]] = relationship(
        "Connection",
        back_populates="recipient",
        foreign_keys="Connection.recipient_id",
        cascade="all, delete-orphan",
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        "AuditLog", back_populates="actor"
    )
