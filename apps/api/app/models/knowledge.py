import enum
import uuid
from typing import Optional, Any, Dict, List, TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.users import User
    from app.models.projects import Project


class KnowledgeVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    CAMPUS_ONLY = "CAMPUS_ONLY"
    PRIVATE = "PRIVATE"


class ProblemSolution(Base, TimestampMixin):
    """Institutional memory record linking problems, root causes, and solutions."""

    __tablename__ = "problem_solutions"

    author_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    problem: Mapped[str] = mapped_column(Text, nullable=False)
    symptoms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    root_cause: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    solution: Mapped[str] = mapped_column(Text, nullable=False)
    technologies: Mapped[Optional[List[str]]] = mapped_column(JSONB, nullable=True)
    domain: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    visibility: Mapped[KnowledgeVisibility] = mapped_column(
        Enum(KnowledgeVisibility, name="knowledge_visibility_enum", native_enum=False),
        default=KnowledgeVisibility.CAMPUS_ONLY,
        nullable=False,
    )

    # Relationships
    author: Mapped[Optional["User"]] = relationship("User", back_populates="problem_solutions")
    project: Mapped[Optional["Project"]] = relationship("Project", back_populates="problem_solutions")
