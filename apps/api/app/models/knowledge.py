import enum
import uuid
from typing import Optional, Any, Dict, List, TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.users import User
    from app.models.projects import Project
    from app.models.research import ResearchItem
    from app.models.skills import Skill


class KnowledgeVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    CAMPUS_ONLY = "CAMPUS_ONLY"
    PRIVATE = "PRIVATE"


class ProblemSolutionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class ProblemSolution(Base, TimestampMixin):
    """Institutional memory record linking problems, root causes, and solutions."""

    __tablename__ = "problem_solutions"

    author_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    research_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("research_items.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    problem: Mapped[str] = mapped_column(Text, nullable=False)
    symptoms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    root_cause: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    solution: Mapped[str] = mapped_column(Text, nullable=False)
    outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    lessons_learned: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    domain: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    status: Mapped[ProblemSolutionStatus] = mapped_column(
        Enum(ProblemSolutionStatus, name="problem_solution_status_enum", native_enum=False),
        default=ProblemSolutionStatus.PUBLISHED,
        nullable=False,
        index=True,
    )
    visibility: Mapped[KnowledgeVisibility] = mapped_column(
        Enum(KnowledgeVisibility, name="knowledge_visibility_enum", native_enum=False),
        default=KnowledgeVisibility.CAMPUS_ONLY,
        nullable=False,
        index=True,
    )
    provenance: Mapped[str] = mapped_column(String(50), default="MANUAL", nullable=False)
    technologies: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True)

    # Relationships
    author: Mapped[Optional["User"]] = relationship("User", back_populates="problem_solutions")
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="problem_solutions")
    research: Mapped[Optional["ResearchItem"]] = relationship("ResearchItem")
    ps_skills: Mapped[List["ProblemSolutionSkill"]] = relationship(
        "ProblemSolutionSkill", back_populates="problem_solution", cascade="all, delete-orphan"
    )
    ps_technologies: Mapped[List["ProblemSolutionTechnology"]] = relationship(
        "ProblemSolutionTechnology", back_populates="problem_solution", cascade="all, delete-orphan"
    )


class ProblemSolutionSkill(Base, TimestampMixin):
    """ProblemSolution to Skill relationship."""

    __tablename__ = "problem_solution_skills"
    __table_args__ = (
        UniqueConstraint("problem_solution_id", "skill_id", name="uq_problem_solution_skill"),
    )

    problem_solution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("problem_solutions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Relationships
    problem_solution: Mapped["ProblemSolution"] = relationship("ProblemSolution", back_populates="ps_skills")
    skill: Mapped["Skill"] = relationship("Skill")


class ProblemSolutionTechnology(Base, TimestampMixin):
    """ProblemSolution to Technology entity."""

    __tablename__ = "problem_solution_technologies"
    __table_args__ = (
        UniqueConstraint("problem_solution_id", "normalized_name", name="uq_problem_solution_technology"),
    )

    problem_solution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("problem_solutions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Relationship
    problem_solution: Mapped["ProblemSolution"] = relationship("ProblemSolution", back_populates="ps_technologies")

