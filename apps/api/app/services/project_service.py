import uuid
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.users import User, UserRole
from app.models.projects import Project, ProjectContributor, ProjectType, ProjectStatus, ProjectVisibility, ContributorRole
from app.repositories.project_repository import ProjectRepository
from app.schemas.projects import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectSkillResponse, ProjectTechnologyResponse, ProjectContributorResponse


class ProjectService:
    """Service layer enforcing project authorization, slug generation, and visibility rules."""

    @staticmethod
    def _is_owner_or_admin(project: Project, current_user: User) -> bool:
        if current_user.role == UserRole.ADMIN:
            return True
        if project.created_by == current_user.id:
            return True
        for c in project.contributors:
            if c.user_id == current_user.id and c.role in (ContributorRole.OWNER, ContributorRole.FACULTY_GUIDE):
                return True
        return False

    @staticmethod
    def _get_allowed_visibilities(current_user: Optional[User]) -> List[ProjectVisibility]:
        if not current_user:
            return [ProjectVisibility.PUBLIC]
        return [ProjectVisibility.PUBLIC, ProjectVisibility.CAMPUS_ONLY]

    @staticmethod
    def to_response_schema(project: Project) -> ProjectResponse:
        creator_name = project.creator.profile.full_name if project.creator and project.creator.profile else None

        skills_resp = [
            ProjectSkillResponse(
                skill_id=ps.skill.id,
                name=ps.skill.name,
                category=ps.skill.category,
            )
            for ps in project.project_skills
            if ps.skill
        ]

        tech_resp = [
            ProjectTechnologyResponse(
                name=pt.name,
                normalized_name=pt.normalized_name,
                category=pt.category,
            )
            for pt in project.technologies
        ]

        contrib_resp = [
            ProjectContributorResponse(
                id=c.id,
                user_id=c.user_id,
                full_name=c.user.profile.full_name if c.user and c.user.profile else None,
                email=c.user.email if c.user else None,
                role=c.role,
                contribution_description=c.contribution_description,
            )
            for c in project.contributors
        ]

        return ProjectResponse(
            id=project.id,
            title=project.title,
            slug=project.slug,
            description=project.description,
            project_type=project.project_type,
            domain=project.domain,
            problem_statement=project.problem_statement,
            methodology=project.methodology,
            outcome=project.outcome,
            visibility=project.visibility,
            status=project.status,
            provenance=project.provenance,
            start_date=project.start_date,
            end_date=project.end_date,
            github_url=project.github_url,
            demo_url=project.demo_url,
            paper_url=project.paper_url,
            video_url=project.video_url,
            created_by=project.created_by,
            created_at=project.created_at,
            updated_at=project.updated_at,
            creator_name=creator_name,
            skills=skills_resp,
            technologies=tech_resp,
            contributors=contrib_resp,
        )

    async def create_project(
        self, db: AsyncSession, current_user: User, data: ProjectCreate
    ) -> ProjectResponse:
        repo = ProjectRepository(db)
        slug_base = data.title.lower().replace(" ", "-").replace("/", "-")
        slug = f"{slug_base}-{str(uuid.uuid4())[:8]}"

        proj = await repo.create_project(
            title=data.title,
            slug=slug,
            description=data.description,
            created_by=current_user.id,
            project_type=data.project_type,
            domain=data.domain,
            problem_statement=data.problem_statement,
            methodology=data.methodology,
            outcome=data.outcome,
            visibility=data.visibility,
            status=data.status,
            start_date=data.start_date,
            end_date=data.end_date,
            github_url=data.github_url,
            demo_url=data.demo_url,
            paper_url=data.paper_url,
            video_url=data.video_url,
        )

        # Add initial contributors
        for c in data.contributors:
            if c.user_id != current_user.id:
                await repo.add_contributor(proj.id, c.user_id, c.role, c.contribution_description)

        # Sync skills and tech
        await repo.sync_skills_and_tech(proj.id, data.skills, data.technologies)

        full_proj = await repo.get_by_id(proj.id)
        return self.to_response_schema(full_proj)

    async def get_project(
        self, db: AsyncSession, current_user: User, project_id: uuid.UUID
    ) -> ProjectResponse:
        repo = ProjectRepository(db)
        proj = await repo.get_by_id(project_id)

        if not proj:
            raise ValueError("Project not found.")

        if proj.visibility == ProjectVisibility.PRIVATE:
            if not self._is_owner_or_admin(proj, current_user):
                raise PermissionError("Access denied: Private project.")

        return self.to_response_schema(proj)

    async def list_projects(
        self,
        db: AsyncSession,
        current_user: User,
        page: int = 1,
        page_size: int = 20,
        status: Optional[ProjectStatus] = None,
        project_type: Optional[ProjectType] = None,
        domain: Optional[str] = None,
    ) -> Tuple[List[ProjectResponse], int]:
        repo = ProjectRepository(db)
        vis_filter = self._get_allowed_visibilities(current_user)

        projects, total = await repo.list_projects(
            page=page,
            page_size=page_size,
            status=status,
            project_type=project_type,
            domain=domain,
            visibility_filter=vis_filter,
        )

        items = [self.to_response_schema(p) for p in projects]
        return items, total

    async def list_user_projects(
        self, db: AsyncSession, current_user: User, page: int = 1, page_size: int = 20
    ) -> Tuple[List[ProjectResponse], int]:
        repo = ProjectRepository(db)
        projects, total = await repo.list_projects(
            page=page, page_size=page_size, creator_id=current_user.id
        )
        items = [self.to_response_schema(p) for p in projects]
        return items, total

    async def update_project(
        self, db: AsyncSession, current_user: User, project_id: uuid.UUID, data: ProjectUpdate
    ) -> ProjectResponse:
        repo = ProjectRepository(db)
        proj = await repo.get_by_id(project_id)

        if not proj:
            raise ValueError("Project not found.")

        if not self._is_owner_or_admin(proj, current_user):
            raise PermissionError("Access denied: You are not authorized to update this project.")

        update_dict = data.model_dump(exclude_unset=True, exclude={"skills", "technologies"})
        await repo.update(proj, update_dict)

        if data.skills is not None or data.technologies is not None:
            new_skills = data.skills if data.skills is not None else [s.name for ps in proj.project_skills if ps.skill]
            new_tech = data.technologies if data.technologies is not None else [t.name for t in proj.technologies]
            await repo.sync_skills_and_tech(project_id, new_skills, new_tech)

        updated_proj = await repo.get_by_id(project_id)
        return self.to_response_schema(updated_proj)

    async def delete_project(
        self, db: AsyncSession, current_user: User, project_id: uuid.UUID
    ) -> None:
        repo = ProjectRepository(db)
        proj = await repo.get_by_id(project_id)

        if not proj:
            raise ValueError("Project not found.")

        if not self._is_owner_or_admin(proj, current_user):
            raise PermissionError("Access denied: You are not authorized to delete this project.")

        await repo.delete(proj)

    async def add_contributor(
        self,
        db: AsyncSession,
        current_user: User,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
        role: ContributorRole,
        description: Optional[str] = None,
    ) -> ProjectResponse:
        repo = ProjectRepository(db)
        proj = await repo.get_by_id(project_id)

        if not proj or not self._is_owner_or_admin(proj, current_user):
            raise PermissionError("Access denied: Cannot add contributors to this project.")

        await repo.add_contributor(project_id, user_id, role, description)
        updated = await repo.get_by_id(project_id)
        return self.to_response_schema(updated)

    async def remove_contributor(
        self, db: AsyncSession, current_user: User, project_id: uuid.UUID, target_user_id: uuid.UUID
    ) -> ProjectResponse:
        repo = ProjectRepository(db)
        proj = await repo.get_by_id(project_id)

        if not proj or not self._is_owner_or_admin(proj, current_user):
            raise PermissionError("Access denied: Cannot remove contributors from this project.")

        await repo.remove_contributor(project_id, target_user_id)
        updated = await repo.get_by_id(project_id)
        return self.to_response_schema(updated)
