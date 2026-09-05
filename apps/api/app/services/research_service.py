import uuid
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.users import User, UserRole
from app.models.research import ResearchItem, ResearchAuthor, PublicationType, ResearchStatus, ResearchVisibility
from app.repositories.research_repository import ResearchRepository
from app.schemas.research import ResearchCreate, ResearchUpdate, ResearchResponse, ResearchAuthorResponse


class ResearchService:
    """Service layer enforcing research paper permissions, co-authorship, and visibility scoping."""

    @staticmethod
    def _is_author_or_admin(research: ResearchItem, current_user: User) -> bool:
        if current_user.role == UserRole.ADMIN:
            return True
        if research.owner_id == current_user.id:
            return True
        for a in research.authors:
            if a.user_id == current_user.id:
                return True
        return False

    @staticmethod
    def to_response_schema(research: ResearchItem) -> ResearchResponse:
        owner_name = research.owner.profile.full_name if research.owner and research.owner.profile else None

        authors_resp = [
            ResearchAuthorResponse(
                id=a.id,
                user_id=a.user_id,
                full_name=a.user.profile.full_name if a.user and a.user.profile else None,
                email=a.user.email if a.user else None,
                author_order=a.author_order,
            )
            for a in sorted(research.authors, key=lambda x: x.author_order)
        ]

        return ResearchResponse(
            id=research.id,
            owner_id=research.owner_id,
            owner_name=owner_name,
            title=research.title,
            abstract=research.abstract,
            research_area=research.research_area,
            publication_type=research.publication_type,
            publication_venue=research.publication_venue,
            publication_date=research.publication_date,
            doi=research.doi,
            publication_url=research.publication_url,
            paper_url=research.paper_url,
            status=research.status,
            visibility=research.visibility,
            provenance=research.provenance,
            created_at=research.created_at,
            updated_at=research.updated_at,
            authors=authors_resp,
        )

    async def create_research(
        self, db: AsyncSession, current_user: User, data: ResearchCreate
    ) -> ResearchResponse:
        repo = ResearchRepository(db)
        research = await repo.create_research(
            owner_id=current_user.id,
            title=data.title,
            abstract=data.abstract,
            research_area=data.research_area,
            publication_type=data.publication_type,
            publication_venue=data.publication_venue,
            publication_date=data.publication_date,
            doi=data.doi,
            publication_url=data.publication_url,
            paper_url=data.paper_url,
            status=data.status,
            visibility=data.visibility,
            author_ids=data.author_ids,
        )
        full_res = await repo.get_by_id(research.id)
        return self.to_response_schema(full_res)

    async def get_research(
        self, db: AsyncSession, current_user: User, research_id: uuid.UUID
    ) -> ResearchResponse:
        repo = ResearchRepository(db)
        res = await repo.get_by_id(research_id)

        if not res:
            raise ValueError("Research paper not found.")

        if res.visibility == ResearchVisibility.PRIVATE and not self._is_author_or_admin(res, current_user):
            raise PermissionError("Access denied: Private research paper.")

        return self.to_response_schema(res)

    async def list_research(
        self,
        db: AsyncSession,
        current_user: User,
        page: int = 1,
        page_size: int = 20,
        publication_type: Optional[PublicationType] = None,
        research_area: Optional[str] = None,
    ) -> Tuple[List[ResearchResponse], int]:
        repo = ResearchRepository(db)
        vis_filter = [ResearchVisibility.PUBLIC, ResearchVisibility.CAMPUS_ONLY]

        records, total = await repo.list_research(
            page=page,
            page_size=page_size,
            publication_type=publication_type,
            research_area=research_area,
            visibility_filter=vis_filter,
        )
        items = [self.to_response_schema(r) for r in records]
        return items, total

    async def list_user_research(
        self, db: AsyncSession, current_user: User, page: int = 1, page_size: int = 20
    ) -> Tuple[List[ResearchResponse], int]:
        repo = ResearchRepository(db)
        records, total = await repo.list_research(page=page, page_size=page_size, owner_id=current_user.id)
        items = [self.to_response_schema(r) for r in records]
        return items, total

    async def update_research(
        self, db: AsyncSession, current_user: User, research_id: uuid.UUID, data: ResearchUpdate
    ) -> ResearchResponse:
        repo = ResearchRepository(db)
        res = await repo.get_by_id(research_id)

        if not res:
            raise ValueError("Research paper not found.")

        if not self._is_author_or_admin(res, current_user):
            raise PermissionError("Access denied: Authorized authors only.")

        update_dict = data.model_dump(exclude_unset=True, exclude={"author_ids"})
        await repo.update(res, update_dict)

        updated_res = await repo.get_by_id(research_id)
        return self.to_response_schema(updated_res)

    async def delete_research(
        self, db: AsyncSession, current_user: User, research_id: uuid.UUID
    ) -> None:
        repo = ResearchRepository(db)
        res = await repo.get_by_id(research_id)

        if not res:
            raise ValueError("Research paper not found.")

        if not self._is_author_or_admin(res, current_user):
            raise PermissionError("Access denied: Authorized authors only.")

        await repo.delete(res)
