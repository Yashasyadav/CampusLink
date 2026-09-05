import uuid
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy import select, func, or_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.projects import (
    Project,
    ProjectContributor,
    ProjectSkill,
    ProjectTechnology,
    ProjectType,
    ProjectVisibility,
    ProjectStatus,
    ContributorRole,
)
from app.models.profiles import Profile
from app.models.users import User
from app.models.skills import Skill
from app.services.normalization_service import NormalizationService


class ProjectRepository:
    """Async database repository for Project CRUD and relationships."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_project(
        self,
        title: str,
        slug: str,
        description: str,
        created_by: uuid.UUID,
        project_type: ProjectType = ProjectType.ACADEMIC,
        domain: Optional[str] = None,
        problem_statement: Optional[str] = None,
        methodology: Optional[str] = None,
        outcome: Optional[str] = None,
        visibility: ProjectVisibility = ProjectVisibility.CAMPUS_ONLY,
        status: ProjectStatus = ProjectStatus.IN_PROGRESS,
        start_date: Optional[Any] = None,
        end_date: Optional[Any] = None,
        github_url: Optional[str] = None,
        demo_url: Optional[str] = None,
        paper_url: Optional[str] = None,
        video_url: Optional[str] = None,
        provenance: str = "MANUAL",
    ) -> Project:
        proj = Project(
            id=uuid.uuid4(),
            title=title,
            slug=slug,
            description=description,
            created_by=created_by,
            project_type=project_type,
            domain=domain,
            problem_statement=problem_statement,
            methodology=methodology,
            outcome=outcome,
            visibility=visibility,
            status=status,
            start_date=start_date,
            end_date=end_date,
            github_url=github_url,
            demo_url=demo_url,
            paper_url=paper_url,
            video_url=video_url,
            provenance=provenance,
        )
        self.db.add(proj)
        await self.db.flush()

        # Add creator as OWNER contributor
        owner_contrib = ProjectContributor(
            id=uuid.uuid4(),
            project_id=proj.id,
            user_id=created_by,
            role=ContributorRole.OWNER,
            contribution_description="Project Creator & Lead",
        )
        self.db.add(owner_contrib)
        await self.db.flush()
        return proj

    async def get_by_id(self, project_id: uuid.UUID) -> Optional[Project]:
        stmt = (
            select(Project)
            .where(Project.id == project_id)
            .options(
                selectinload(Project.contributors).selectinload(ProjectContributor.user).selectinload(User.profile),
                selectinload(Project.project_skills).selectinload(ProjectSkill.skill),
                selectinload(Project.technologies),
                selectinload(Project.creator).selectinload(User.profile),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_projects(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[ProjectStatus] = None,
        project_type: Optional[ProjectType] = None,
        domain: Optional[str] = None,
        visibility_filter: Optional[List[ProjectVisibility]] = None,
        creator_id: Optional[uuid.UUID] = None,
    ) -> Tuple[List[Project], int]:
        stmt = select(Project)

        if status:
            stmt = stmt.where(Project.status == status)
        if project_type:
            stmt = stmt.where(Project.project_type == project_type)
        if domain:
            stmt = stmt.where(Project.domain.ilike(f"%{domain}%"))
        if visibility_filter:
            stmt = stmt.where(Project.visibility.in_(visibility_filter))
        if creator_id:
            stmt = stmt.where(Project.created_by == creator_id)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = (
            stmt.order_by(Project.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .options(
                selectinload(Project.contributors).selectinload(ProjectContributor.user).selectinload(User.profile),
                selectinload(Project.project_skills).selectinload(ProjectSkill.skill),
                selectinload(Project.technologies),
                selectinload(Project.creator).selectinload(User.profile),
            )
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total

    async def update(self, project: Project, update_data: Dict[str, Any]) -> Project:
        for field, val in update_data.items():
            if val is not None and hasattr(project, field):
                setattr(project, field, val)
        await self.db.flush()
        return project

    async def delete(self, project: Project) -> None:
        await self.db.delete(project)
        await self.db.flush()

    async def add_contributor(
        self, project_id: uuid.UUID, user_id: uuid.UUID, role: ContributorRole, desc: Optional[str] = None
    ) -> ProjectContributor:
        stmt = select(ProjectContributor).where(
            ProjectContributor.project_id == project_id, ProjectContributor.user_id == user_id
        )
        res = await self.db.execute(stmt)
        contrib = res.scalar_one_or_none()

        if contrib:
            contrib.role = role
            contrib.contribution_description = desc
        else:
            contrib = ProjectContributor(
                id=uuid.uuid4(),
                project_id=project_id,
                user_id=user_id,
                role=role,
                contribution_description=desc,
            )
            self.db.add(contrib)

        await self.db.flush()
        return contrib

    async def remove_contributor(self, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        stmt = select(ProjectContributor).where(
            ProjectContributor.project_id == project_id, ProjectContributor.user_id == user_id
        )
        res = await self.db.execute(stmt)
        contrib = res.scalar_one_or_none()
        if contrib:
            await self.db.delete(contrib)
            await self.db.flush()
            return True
        return False

    async def sync_skills_and_tech(
        self, project_id: uuid.UUID, skills: List[str], technologies: List[str]
    ) -> None:
        # Clear existing skills and tech
        await self.db.execute(delete(ProjectSkill).where(ProjectSkill.project_id == project_id))
        await self.db.execute(delete(ProjectTechnology).where(ProjectTechnology.project_id == project_id))

        # Add skills
        for s_name in skills:
            if not s_name or not s_name.strip():
                continue
            skill_obj = await NormalizationService.get_or_create_skill(self.db, s_name.strip())
            ps = ProjectSkill(id=uuid.uuid4(), project_id=project_id, skill_id=skill_obj.id)
            self.db.add(ps)

        # Add technologies
        for t_name in technologies:
            if not t_name or not t_name.strip():
                continue
            canonical = NormalizationService.normalize_name(t_name.strip())
            norm_key = NormalizationService.get_normalized_key(t_name.strip())

            pt = ProjectTechnology(
                id=uuid.uuid4(),
                project_id=project_id,
                name=canonical,
                normalized_name=norm_key,
                category="General",
            )
            self.db.add(pt)

        await self.db.flush()
