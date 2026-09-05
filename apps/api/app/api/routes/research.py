import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.users import User
from app.models.research import PublicationType
from app.schemas.common import PaginatedResponse
from app.schemas.research import ResearchCreate, ResearchUpdate, ResearchResponse
from app.services.research_service import ResearchService

router = APIRouter(prefix="/research", tags=["Research & Publications"])
research_service = ResearchService()


@router.post(
    "",
    response_model=ResearchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new research paper record",
)
async def create_research(
    data: ResearchCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create research publication record."""
    try:
        res = await research_service.create_research(db, current_user, data)
        await db.commit()
        return res
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "",
    response_model=PaginatedResponse[ResearchResponse],
    summary="List research publications with pagination and filtering",
)
async def list_research(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    publication_type: Optional[PublicationType] = Query(default=None),
    research_area: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List research records filtered by publication_type or research_area."""
    items, total = await research_service.list_research(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        publication_type=publication_type,
        research_area=research_area,
    )
    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/mine",
    response_model=PaginatedResponse[ResearchResponse],
    summary="List current user's research papers",
)
async def list_my_research(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get research papers authored or owned by current user."""
    items, total = await research_service.list_user_research(
        db=db, current_user=current_user, page=page, page_size=page_size
    )
    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/{research_id}",
    response_model=ResearchResponse,
    summary="Get research details by ID",
)
async def get_research(
    research_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get research publication details."""
    try:
        return await research_service.get_research(db, current_user, research_id)
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.patch(
    "/{research_id}",
    response_model=ResearchResponse,
    summary="Update research paper details",
)
async def update_research(
    research_id: uuid.UUID,
    data: ResearchUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update research paper (Author or Admin only)."""
    try:
        res = await research_service.update_research(db, current_user, research_id, data)
        await db.commit()
        return res
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.delete(
    "/{research_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a research paper",
)
async def delete_research(
    research_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete research paper (Author or Admin only)."""
    try:
        await research_service.delete_research(db, current_user, research_id)
        await db.commit()
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
