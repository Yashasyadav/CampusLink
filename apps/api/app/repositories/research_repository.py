import uuid
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.research import ResearchItem, ResearchAuthor, PublicationType, ResearchStatus, ResearchVisibility
from app.models.users import User


class ResearchRepository:
    """Async database repository for ResearchItem domain CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_research(
        self,
        owner_id: uuid.UUID,
        title: str,
        abstract: Optional[str] = None,
        research_area: Optional[str] = None,
        publication_type: PublicationType = PublicationType.JOURNAL,
        publication_venue: Optional[str] = None,
        publication_date: Optional[Any] = None,
        doi: Optional[str] = None,
        publication_url: Optional[str] = None,
        paper_url: Optional[str] = None,
        status: ResearchStatus = ResearchStatus.PUBLISHED,
        visibility: ResearchVisibility = ResearchVisibility.CAMPUS_ONLY,
        author_ids: Optional[List[uuid.UUID]] = None,
    ) -> ResearchItem:
        research = ResearchItem(
            id=uuid.uuid4(),
            owner_id=owner_id,
            title=title,
            abstract=abstract,
            research_area=research_area,
            publication_type=publication_type,
            publication_venue=publication_venue,
            publication_date=publication_date,
            doi=doi,
            publication_url=publication_url,
            paper_url=paper_url,
            status=status,
            visibility=visibility,
            provenance="MANUAL",
        )
        self.db.add(research)
        await self.db.flush()

        # Add author links
        all_authors = [owner_id] + [a for a in (author_ids or []) if a != owner_id]
        for idx, u_id in enumerate(all_authors, start=1):
            ra = ResearchAuthor(
                id=uuid.uuid4(),
                research_id=research.id,
                user_id=u_id,
                author_order=idx,
            )
            self.db.add(ra)

        await self.db.flush()
        return research

    async def get_by_id(self, research_id: uuid.UUID) -> Optional[ResearchItem]:
        stmt = (
            select(ResearchItem)
            .where(ResearchItem.id == research_id)
            .options(
                selectinload(ResearchItem.authors).selectinload(ResearchAuthor.user).selectinload(User.profile),
                selectinload(ResearchItem.owner).selectinload(User.profile),
            )
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def list_research(
        self,
        page: int = 1,
        page_size: int = 20,
        publication_type: Optional[PublicationType] = None,
        research_area: Optional[str] = None,
        visibility_filter: Optional[List[ResearchVisibility]] = None,
        owner_id: Optional[uuid.UUID] = None,
    ) -> Tuple[List[ResearchItem], int]:
        stmt = select(ResearchItem)

        if publication_type:
            stmt = stmt.where(ResearchItem.publication_type == publication_type)
        if research_area:
            stmt = stmt.where(ResearchItem.research_area.ilike(f"%{research_area}%"))
        if visibility_filter:
            stmt = stmt.where(ResearchItem.visibility.in_(visibility_filter))
        if owner_id:
            stmt = stmt.where(ResearchItem.owner_id == owner_id)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = (
            stmt.order_by(ResearchItem.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .options(
                selectinload(ResearchItem.authors).selectinload(ResearchAuthor.user).selectinload(User.profile),
                selectinload(ResearchItem.owner).selectinload(User.profile),
            )
        )

        res = await self.db.execute(stmt)
        return list(res.scalars().all()), total

    async def update(self, research: ResearchItem, update_data: Dict[str, Any]) -> ResearchItem:
        for field, val in update_data.items():
            if val is not None and hasattr(research, field):
                setattr(research, field, val)
        await self.db.flush()
        return research

    async def delete(self, research: ResearchItem) -> None:
        await self.db.delete(research)
        await self.db.flush()
