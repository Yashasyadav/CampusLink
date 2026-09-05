import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.users import User
from app.models.facilities import FacilityStatus
from app.schemas.common import PaginatedResponse
from app.schemas.facilities import FacilityCreate, FacilityUpdate, FacilityResponse
from app.schemas.equipment import EquipmentCreate, EquipmentResponse
from app.services.facility_service import FacilityService

router = APIRouter(prefix="/facilities", tags=["Facilities & Labs"])
facility_service = FacilityService()


@router.post(
    "",
    response_model=FacilityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new campus facility/lab",
)
async def create_facility(
    data: FacilityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create lab/facility record (Faculty or Admin only)."""
    try:
        res = await facility_service.create_facility(db, current_user, data)
        await db.commit()
        return res
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "",
    response_model=PaginatedResponse[FacilityResponse],
    summary="List facilities with pagination and filtering",
)
async def list_facilities(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    facility_type: Optional[str] = Query(default=None),
    status_filter: Optional[FacilityStatus] = Query(default=None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List campus lab facilities."""
    items, total = await facility_service.list_facilities(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        facility_type=facility_type,
        status=status_filter,
    )
    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/{facility_id}",
    response_model=FacilityResponse,
    summary="Get facility details by ID",
)
async def get_facility(
    facility_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get facility details including equipment summary."""
    try:
        return await facility_service.get_facility(db, current_user, facility_id)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.patch(
    "/{facility_id}",
    response_model=FacilityResponse,
    summary="Update facility details",
)
async def update_facility(
    facility_id: uuid.UUID,
    data: FacilityUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update facility info (Responsible user or Admin only)."""
    try:
        res = await facility_service.update_facility(db, current_user, facility_id, data)
        await db.commit()
        return res
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.delete(
    "/{facility_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a facility",
)
async def delete_facility(
    facility_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a facility (Responsible user or Admin only)."""
    try:
        await facility_service.delete_facility(db, current_user, facility_id)
        await db.commit()
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.post(
    "/{facility_id}/equipment",
    response_model=EquipmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add equipment item to facility",
)
async def create_equipment(
    facility_id: uuid.UUID,
    data: EquipmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create equipment record linked to facility."""
    try:
        res = await facility_service.create_equipment(db, current_user, facility_id, data)
        await db.commit()
        return res
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

