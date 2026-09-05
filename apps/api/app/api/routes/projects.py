import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.users import User
from app.models.projects import ProjectType, ProjectStatus, ContributorRole
from app.schemas.common import PaginatedResponse
from app.schemas.projects import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["Campus Projects"])
project_service = ProjectService()


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new campus project",
)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create project entity and assign current user as OWNER contributor."""
    try:
        res = await project_service.create_project(db, current_user, data)
        await db.commit()
        return res
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "",
    response_model=PaginatedResponse[ProjectResponse],
    summary="List and filter campus projects with pagination",
)
async def list_projects(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: Optional[ProjectStatus] = Query(default=None, alias="status"),
    project_type: Optional[ProjectType] = Query(default=None),
    domain: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch paginated campus projects filtered by status, project_type, or domain."""
    items, total = await project_service.list_projects(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        status=status_filter,
        project_type=project_type,
        domain=domain,
    )
    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/mine",
    response_model=PaginatedResponse[ProjectResponse],
    summary="List current user's projects",
)
async def list_my_projects(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get projects created by current authenticated user."""
    items, total = await project_service.list_user_projects(
        db=db, current_user=current_user, page=page, page_size=page_size
    )
    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get project details by ID",
)
async def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch detailed project profile by UUID."""
    try:
        return await project_service.get_project(db, current_user, project_id)
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.patch(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update project details",
)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update project fields (Owner or Admin only)."""
    try:
        res = await project_service.update_project(db, current_user, project_id, data)
        await db.commit()
        return res
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a project",
)
async def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a project (Owner or Admin only)."""
    try:
        await project_service.delete_project(db, current_user, project_id)
        await db.commit()
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.post(
    "/{project_id}/contributors",
    response_model=ProjectResponse,
    summary="Add a contributor to project",
)
async def add_contributor(
    project_id: uuid.UUID,
    user_id: uuid.UUID = Query(...),
    role: ContributorRole = Query(default=ContributorRole.CONTRIBUTOR),
    description: Optional[str] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add user contributor to project (Owner or Admin only)."""
    try:
        res = await project_service.add_contributor(db, current_user, project_id, user_id, role, description)
        await db.commit()
        return res
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))


@router.delete(
    "/{project_id}/contributors/{target_user_id}",
    response_model=ProjectResponse,
    summary="Remove a contributor from project",
)
async def remove_contributor(
    project_id: uuid.UUID,
    target_user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove user contributor from project (Owner or Admin only)."""
    try:
        res = await project_service.remove_contributor(db, current_user, project_id, target_user_id)
        await db.commit()
        return res
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
