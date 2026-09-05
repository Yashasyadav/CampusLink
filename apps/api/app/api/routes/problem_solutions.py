import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.users import User
from app.schemas.common import PaginatedResponse
from app.schemas.knowledge import (
    ProblemSolutionCreate,
    ProblemSolutionUpdate,
    ProblemSolutionResponse,
)
from app.services.knowledge_service import ProblemSolutionsService

router = APIRouter(prefix="/solutions", tags=["Problem / Solution Knowledge Base"])
ps_service = ProblemSolutionsService()


@router.post(
    "",
    response_model=ProblemSolutionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new problem/solution record",
)
async def create_problem_solution(
    data: ProblemSolutionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a institutional problem-solution record."""
    try:
        res = await ps_service.create_problem_solution(db, current_user, data)
        await db.commit()
        return res
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "",
    response_model=PaginatedResponse[ProblemSolutionResponse],
    summary="List published problem/solution records",
)
async def list_problem_solutions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    domain: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List problem-solution records filtered by domain."""
    items, total = await ps_service.list_problem_solutions(
        db=db, current_user=current_user, page=page, page_size=page_size, domain=domain
    )
    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/mine",
    response_model=PaginatedResponse[ProblemSolutionResponse],
    summary="List current user's problem/solution records",
)
async def list_my_problem_solutions(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List problem-solution records created by current user."""
    items, total = await ps_service.list_user_problem_solutions(
        db=db, current_user=current_user, page=page, page_size=page_size
    )
    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/{solution_id}",
    response_model=ProblemSolutionResponse,
    summary="Get problem/solution record details",
)
async def get_problem_solution(
    solution_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed problem-solution record."""
    try:
        return await ps_service.get_problem_solution(db, current_user, solution_id)
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.patch(
    "/{solution_id}",
    response_model=ProblemSolutionResponse,
    summary="Update problem/solution record",
)
async def update_problem_solution(
    solution_id: uuid.UUID,
    data: ProblemSolutionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update problem-solution record (Author or Admin only)."""
    try:
        res = await ps_service.update_problem_solution(db, current_user, solution_id, data)
        await db.commit()
        return res
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.delete(
    "/{solution_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete problem/solution record",
)
async def delete_problem_solution(
    solution_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete problem-solution record (Author or Admin only)."""
    try:
        await ps_service.delete_problem_solution(db, current_user, solution_id)
        await db.commit()
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
