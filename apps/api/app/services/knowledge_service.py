import uuid
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.users import User, UserRole
from app.models.knowledge import ProblemSolution, KnowledgeVisibility, ProblemSolutionStatus
from app.repositories.knowledge_repository import ProblemSolutionRepository
from app.schemas.knowledge import (
    ProblemSolutionCreate,
    ProblemSolutionUpdate,
    ProblemSolutionResponse,
    ProblemSolutionSkillResponse,
    ProblemSolutionTechResponse,
)


class ProblemSolutionsService:
    """Service layer managing Problem/Solution institutional memory records."""

    @staticmethod
    def _is_author_or_admin(record: ProblemSolution, current_user: User) -> bool:
        if current_user.role == UserRole.ADMIN:
            return True
        if record.author_id == current_user.id:
            return True
        return False

    @staticmethod
    def to_response_schema(record: ProblemSolution) -> ProblemSolutionResponse:
        author_name = record.author.profile.full_name if record.author and record.author.profile else None
        project_title = record.project.title if record.project else None
        research_title = record.research.title if record.research else None

        skills_resp = [
            ProblemSolutionSkillResponse(skill_id=pss.skill.id, name=pss.skill.name)
            for pss in record.ps_skills
            if pss.skill
        ]

        tech_resp = [
            ProblemSolutionTechResponse(name=pst.name, normalized_name=pst.normalized_name)
            for pst in record.ps_technologies
        ]

        return ProblemSolutionResponse(
            id=record.id,
            author_id=record.author_id,
            author_name=author_name,
            project_id=record.project_id,
            project_title=project_title,
            research_id=record.research_id,
            research_title=research_title,
            title=record.title,
            problem=record.problem,
            symptoms=record.symptoms,
            root_cause=record.root_cause,
            solution=record.solution,
            outcome=record.outcome,
            lessons_learned=record.lessons_learned,
            domain=record.domain,
            status=record.status,
            visibility=record.visibility,
            provenance=record.provenance,
            created_at=record.created_at,
            updated_at=record.updated_at,
            skills=skills_resp,
            technologies=tech_resp,
        )

    async def create_problem_solution(
        self, db: AsyncSession, current_user: User, data: ProblemSolutionCreate
    ) -> ProblemSolutionResponse:
        repo = ProblemSolutionRepository(db)
        record = await repo.create_problem_solution(
            author_id=current_user.id,
            title=data.title,
            problem=data.problem,
            solution=data.solution,
            symptoms=data.symptoms,
            root_cause=data.root_cause,
            outcome=data.outcome,
            lessons_learned=data.lessons_learned,
            domain=data.domain,
            project_id=data.project_id,
            research_id=data.research_id,
            status=data.status,
            visibility=data.visibility,
        )

        await repo.sync_skills_and_tech(record.id, data.skills, data.technologies)
        full_rec = await repo.get_by_id(record.id)
        return self.to_response_schema(full_rec)

    async def get_problem_solution(
        self, db: AsyncSession, current_user: User, record_id: uuid.UUID
    ) -> ProblemSolutionResponse:
        repo = ProblemSolutionRepository(db)
        rec = await repo.get_by_id(record_id)

        if not rec:
            raise ValueError("Problem/Solution record not found.")

        if rec.status == ProblemSolutionStatus.DRAFT and not self._is_author_or_admin(rec, current_user):
            raise PermissionError("Access denied: Draft record.")

        if rec.visibility == KnowledgeVisibility.PRIVATE and not self._is_author_or_admin(rec, current_user):
            raise PermissionError("Access denied: Private record.")

        return self.to_response_schema(rec)

    async def list_problem_solutions(
        self,
        db: AsyncSession,
        current_user: User,
        page: int = 1,
        page_size: int = 20,
        domain: Optional[str] = None,
    ) -> Tuple[List[ProblemSolutionResponse], int]:
        repo = ProblemSolutionRepository(db)
        vis_filter = [KnowledgeVisibility.PUBLIC, KnowledgeVisibility.CAMPUS_ONLY]

        records, total = await repo.list_problem_solutions(
            page=page,
            page_size=page_size,
            domain=domain,
            status=ProblemSolutionStatus.PUBLISHED,
            visibility_filter=vis_filter,
        )
        items = [self.to_response_schema(r) for r in records]
        return items, total

    async def list_user_problem_solutions(
        self, db: AsyncSession, current_user: User, page: int = 1, page_size: int = 20
    ) -> Tuple[List[ProblemSolutionResponse], int]:
        repo = ProblemSolutionRepository(db)
        records, total = await repo.list_problem_solutions(
            page=page, page_size=page_size, author_id=current_user.id
        )
        items = [self.to_response_schema(r) for r in records]
        return items, total

    async def update_problem_solution(
        self, db: AsyncSession, current_user: User, record_id: uuid.UUID, data: ProblemSolutionUpdate
    ) -> ProblemSolutionResponse:
        repo = ProblemSolutionRepository(db)
        rec = await repo.get_by_id(record_id)

        if not rec:
            raise ValueError("Problem/Solution record not found.")

        if not self._is_author_or_admin(rec, current_user):
            raise PermissionError("Access denied: Author only.")

        update_dict = data.model_dump(exclude_unset=True, exclude={"skills", "technologies"})
        await repo.update(rec, update_dict)

        if data.skills is not None or data.technologies is not None:
            new_skills = data.skills if data.skills is not None else [pss.skill.name for pss in rec.ps_skills if pss.skill]
            new_tech = data.technologies if data.technologies is not None else [pst.name for pst in rec.ps_technologies]
            await repo.sync_skills_and_tech(record_id, new_skills, new_tech)

        updated = await repo.get_by_id(record_id)
        return self.to_response_schema(updated)

    async def delete_problem_solution(
        self, db: AsyncSession, current_user: User, record_id: uuid.UUID
    ) -> None:
        repo = ProblemSolutionRepository(db)
        rec = await repo.get_by_id(record_id)

        if not rec:
            raise ValueError("Problem/Solution record not found.")

        if not self._is_author_or_admin(rec, current_user):
            raise PermissionError("Access denied: Author only.")

        await repo.delete(rec)
