import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.users import User
from app.models.facilities import EquipmentStatus, AvailabilityStatus
from app.schemas.common import PaginatedResponse
from app.schemas.equipment import EquipmentUpdate, EquipmentResponse
from app.services.facility_service import FacilityService

router = APIRouter(prefix="/equipment", tags=["Equipment"])
facility_service = FacilityService()


@router.get(
    "",
    response_model=PaginatedResponse[EquipmentResponse],
    summary="List equipment with pagination and filtering",
)
async def list_equipment(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    facility_id: Optional[uuid.UUID] = Query(default=None),
    category: Optional[str] = Query(default=None),
    status_filter: Optional[EquipmentStatus] = Query(default=None, alias="status"),
    availability_status: Optional[AvailabilityStatus] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List lab equipment assets."""
    items, total = await facility_service.list_equipment(
        db=db,
        current_user=current_user,
        facility_id=facility_id,
        category=category,
        status=status_filter,
        availability_status=availability_status,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


@router.get(
    "/{equipment_id}",
    response_model=EquipmentResponse,
    summary="Get equipment details by ID",
)
async def get_equipment(
    equipment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed information about an equipment asset."""
    try:
        return await facility_service.get_equipment(db, current_user, equipment_id)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.patch(
    "/{equipment_id}",
    response_model=EquipmentResponse,
    summary="Update equipment details",
)
async def update_equipment(
    equipment_id: uuid.UUID,
    data: EquipmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update equipment status/details (Facility manager or Admin only)."""
    try:
        res = await facility_service.update_equipment(db, current_user, equipment_id, data)
        await db.commit()
        return res
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))


@router.delete(
    "/{equipment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete equipment asset",
)
async def delete_equipment(
    equipment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete equipment asset (Facility manager or Admin only)."""
    try:
        await facility_service.delete_equipment(db, current_user, equipment_id)
        await db.commit()
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
