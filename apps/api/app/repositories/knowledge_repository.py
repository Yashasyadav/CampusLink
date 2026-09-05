import uuid
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.knowledge import (
    ProblemSolution,
    ProblemSolutionSkill,
    ProblemSolutionTechnology,
    ProblemSolutionStatus,
    KnowledgeVisibility,
)
from app.models.users import User
from app.services.normalization_service import NormalizationService


class ProblemSolutionRepository:
    """Async database repository for ProblemSolution institutional memory records."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_problem_solution(
        self,
        author_id: Optional[uuid.UUID],
        title: str,
        problem: str,
        solution: str,
        symptoms: Optional[str] = None,
        root_cause: Optional[str] = None,
        outcome: Optional[str] = None,
        lessons_learned: Optional[str] = None,
        domain: Optional[str] = None,
        project_id: Optional[uuid.UUID] = None,
        research_id: Optional[uuid.UUID] = None,
        status: ProblemSolutionStatus = ProblemSolutionStatus.PUBLISHED,
        visibility: KnowledgeVisibility = KnowledgeVisibility.CAMPUS_ONLY,
        provenance: str = "MANUAL",
    ) -> ProblemSolution:
        record = ProblemSolution(
            id=uuid.uuid4(),
            author_id=author_id,
            project_id=project_id,
            research_id=research_id,
            title=title,
            problem=problem,
            symptoms=symptoms,
            root_cause=root_cause,
            solution=solution,
            outcome=outcome,
            lessons_learned=lessons_learned,
            domain=domain,
            status=status,
            visibility=visibility,
            provenance=provenance,
        )
        self.db.add(record)
        await self.db.flush()
        return record

    async def get_by_id(self, record_id: uuid.UUID) -> Optional[ProblemSolution]:
        stmt = (
            select(ProblemSolution)
            .where(ProblemSolution.id == record_id)
            .options(
                selectinload(ProblemSolution.author).selectinload(User.profile),
                selectinload(ProblemSolution.project),
                selectinload(ProblemSolution.research),
                selectinload(ProblemSolution.ps_skills).selectinload(ProblemSolutionSkill.skill),
                selectinload(ProblemSolution.ps_technologies),
            )
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def list_problem_solutions(
        self,
        page: int = 1,
        page_size: int = 20,
        domain: Optional[str] = None,
        status: Optional[ProblemSolutionStatus] = None,
        visibility_filter: Optional[List[KnowledgeVisibility]] = None,
        author_id: Optional[uuid.UUID] = None,
    ) -> Tuple[List[ProblemSolution], int]:
        stmt = select(ProblemSolution)

        if domain:
            stmt = stmt.where(ProblemSolution.domain.ilike(f"%{domain}%"))
        if status:
            stmt = stmt.where(ProblemSolution.status == status)
        if visibility_filter:
            stmt = stmt.where(ProblemSolution.visibility.in_(visibility_filter))
        if author_id:
            stmt = stmt.where(ProblemSolution.author_id == author_id)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = (
            stmt.order_by(ProblemSolution.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .options(
                selectinload(ProblemSolution.author).selectinload(User.profile),
                selectinload(ProblemSolution.project),
                selectinload(ProblemSolution.research),
                selectinload(ProblemSolution.ps_skills).selectinload(ProblemSolutionSkill.skill),
                selectinload(ProblemSolution.ps_technologies),
            )
        )

        res = await self.db.execute(stmt)
        return list(res.scalars().all()), total

    async def update(self, record: ProblemSolution, update_data: Dict[str, Any]) -> ProblemSolution:
        for field, val in update_data.items():
            if val is not None and hasattr(record, field):
                setattr(record, field, val)
        await self.db.flush()
        return record

    async def delete(self, record: ProblemSolution) -> None:
        await self.db.delete(record)
        await self.db.flush()

    async def sync_skills_and_tech(
        self, record_id: uuid.UUID, skills: List[str], technologies: List[str]
    ) -> None:
        # Clear existing
        await self.db.execute(
            delete(ProblemSolutionSkill).where(ProblemSolutionSkill.problem_solution_id == record_id)
        )
        await self.db.execute(
            delete(ProblemSolutionTechnology).where(ProblemSolutionTechnology.problem_solution_id == record_id)
        )

        # Add skills
        for s_name in skills:
            if not s_name or not s_name.strip():
                continue
            skill_obj = await NormalizationService.get_or_create_skill(self.db, s_name.strip())
            pss = ProblemSolutionSkill(id=uuid.uuid4(), problem_solution_id=record_id, skill_id=skill_obj.id)
            self.db.add(pss)

        # Add tech
        for t_name in technologies:
            if not t_name or not t_name.strip():
                continue
            canonical = NormalizationService.normalize_name(t_name.strip())
            norm_key = NormalizationService.get_normalized_key(t_name.strip())

            pst = ProblemSolutionTechnology(
                id=uuid.uuid4(),
                problem_solution_id=record_id,
                name=canonical,
                normalized_name=norm_key,
            )
            self.db.add(pst)

        await self.db.flush()
