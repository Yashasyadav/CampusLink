import enum
import uuid
from datetime import date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Date, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.users import User
    from app.models.skills import Skill
    from app.models.knowledge import ProblemSolution


class ProjectVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    CAMPUS_ONLY = "CAMPUS_ONLY"
    PRIVATE = "PRIVATE"


class ProjectStatus(str, enum.Enum):
    PROPOSED = "PROPOSED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class ContributorRole(str, enum.Enum):
    OWNER = "OWNER"
    CONTRIBUTOR = "CONTRIBUTOR"
    MENTOR = "MENTOR"
    FACULTY_GUIDE = "FACULTY_GUIDE"


class Project(Base, TimestampMixin):
    """Project domain entity."""

    __tablename__ = "projects"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    domain: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    problem_statement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    methodology: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    visibility: Mapped[ProjectVisibility] = mapped_column(
        Enum(ProjectVisibility, name="project_visibility_enum", native_enum=False),
        default=ProjectVisibility.CAMPUS_ONLY,
        nullable=False,
    )
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus, name="project_status_enum", native_enum=False),
        default=ProjectStatus.IN_PROGRESS,
        nullable=False,
    )
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    demo_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    paper_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Relationships
    creator: Mapped[Optional["User"]] = relationship("User", back_populates="created_projects")
    contributors: Mapped[List["ProjectContributor"]] = relationship(
        "ProjectContributor", back_populates="project", cascade="all, delete-orphan"
    )
    project_skills: Mapped[List["ProjectSkill"]] = relationship(
        "ProjectSkill", back_populates="project", cascade="all, delete-orphan"
    )
    technologies: Mapped[List["ProjectTechnology"]] = relationship(
        "ProjectTechnology", back_populates="project", cascade="all, delete-orphan"
    )
    problem_solutions: Mapped[List["ProblemSolution"]] = relationship(
        "ProblemSolution", back_populates="project"
    )


class ProjectContributor(Base, TimestampMixin):
    """Project-to-User contributor relationship."""

    __tablename__ = "project_contributors"
    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_project_contributor"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[ContributorRole] = mapped_column(
        Enum(ContributorRole, name="contributor_role_enum", native_enum=False),
        default=ContributorRole.CONTRIBUTOR,
        nullable=False,
    )
    contribution_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="contributors")
    user: Mapped["User"] = relationship("User", back_populates="project_contributions")


class ProjectSkill(Base, TimestampMixin):
    """Project-to-Skill many-to-many relationship."""

    __tablename__ = "project_skills"
    __table_args__ = (
        UniqueConstraint("project_id", "skill_id", name="uq_project_skill"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="project_skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="project_skills")


class ProjectTechnology(Base, TimestampMixin):
    """Normalized project technologies entity."""

    __tablename__ = "project_technologies"
    __table_args__ = (
        UniqueConstraint("project_id", "normalized_name", name="uq_project_technology"),
    )

    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationship
    project: Mapped["Project"] = relationship("Project", back_populates="technologies")
