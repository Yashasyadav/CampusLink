import uuid
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.facilities import Facility, Equipment, FacilityStatus, EquipmentStatus, AvailabilityStatus, FacilityVisibility, EquipmentVisibility
from app.models.users import User


class FacilityRepository:
    """Async database repository for Facility and Equipment CRUD operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # Facility CRUD
    async def create_facility(
        self,
        name: str,
        facility_type: str,
        location: str,
        building: Optional[str] = None,
        floor: Optional[str] = None,
        department: Optional[str] = None,
        contact_email: Optional[str] = None,
        operating_hours: Optional[str] = None,
        description: Optional[str] = None,
        capabilities: Optional[str] = None,
        responsible_user_id: Optional[uuid.UUID] = None,
        status: FacilityStatus = FacilityStatus.OPERATIONAL,
        availability_notes: Optional[str] = None,
        visibility: FacilityVisibility = FacilityVisibility.CAMPUS_ONLY,
    ) -> Facility:
        fac = Facility(
            id=uuid.uuid4(),
            name=name,
            facility_type=facility_type,
            location=location,
            building=building,
            floor=floor,
            department=department,
            contact_email=contact_email,
            operating_hours=operating_hours,
            description=description,
            capabilities=capabilities,
            responsible_user_id=responsible_user_id,
            status=status,
            availability_notes=availability_notes,
            visibility=visibility,
        )
        self.db.add(fac)
        await self.db.flush()
        return fac

    async def get_facility_by_id(self, facility_id: uuid.UUID) -> Optional[Facility]:
        stmt = (
            select(Facility)
            .where(Facility.id == facility_id)
            .options(
                selectinload(Facility.equipment),
                selectinload(Facility.responsible_user).selectinload(User.profile),
            )
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def list_facilities(
        self,
        page: int = 1,
        page_size: int = 20,
        facility_type: Optional[str] = None,
        status: Optional[FacilityStatus] = None,
        visibility_filter: Optional[List[FacilityVisibility]] = None,
    ) -> Tuple[List[Facility], int]:
        stmt = select(Facility)

        if facility_type:
            stmt = stmt.where(Facility.facility_type.ilike(f"%{facility_type}%"))
        if status:
            stmt = stmt.where(Facility.status == status)
        if visibility_filter:
            stmt = stmt.where(Facility.visibility.in_(visibility_filter))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = (
            stmt.order_by(Facility.name.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .options(
                selectinload(Facility.equipment),
                selectinload(Facility.responsible_user).selectinload(User.profile),
            )
        )

        res = await self.db.execute(stmt)
        return list(res.scalars().all()), total

    async def update_facility(self, facility: Facility, update_data: Dict[str, Any]) -> Facility:
        for field, val in update_data.items():
            if val is not None and hasattr(facility, field):
                setattr(facility, field, val)
        await self.db.flush()
        return facility

    async def delete_facility(self, facility: Facility) -> None:
        await self.db.delete(facility)
        await self.db.flush()

    # Equipment CRUD
    async def create_equipment(
        self,
        facility_id: uuid.UUID,
        name: str,
        category: Optional[str] = None,
        description: Optional[str] = None,
        capability: Optional[str] = None,
        quantity: int = 1,
        status: EquipmentStatus = EquipmentStatus.OPERATIONAL,
        availability_status: AvailabilityStatus = AvailabilityStatus.AVAILABLE,
        visibility: EquipmentVisibility = EquipmentVisibility.CAMPUS_ONLY,
    ) -> Equipment:
        eq = Equipment(
            id=uuid.uuid4(),
            facility_id=facility_id,
            name=name,
            category=category,
            description=description,
            capability=capability,
            quantity=quantity,
            status=status,
            availability_status=availability_status,
            visibility=visibility,
        )
        self.db.add(eq)
        await self.db.flush()
        return eq

    async def get_equipment_by_id(self, equipment_id: uuid.UUID) -> Optional[Equipment]:
        stmt = (
            select(Equipment)
            .where(Equipment.id == equipment_id)
            .options(selectinload(Equipment.facility))
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def list_equipment(
        self,
        facility_id: Optional[uuid.UUID] = None,
        category: Optional[str] = None,
        status: Optional[EquipmentStatus] = None,
        availability_status: Optional[AvailabilityStatus] = None,
        visibility_filter: Optional[List[EquipmentVisibility]] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Equipment], int]:
        stmt = select(Equipment)

        if facility_id:
            stmt = stmt.where(Equipment.facility_id == facility_id)
        if category:
            stmt = stmt.where(Equipment.category.ilike(f"%{category}%"))
        if status:
            stmt = stmt.where(Equipment.status == status)
        if availability_status:
            stmt = stmt.where(Equipment.availability_status == availability_status)
        if visibility_filter:
            stmt = stmt.where(Equipment.visibility.in_(visibility_filter))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar() or 0

        stmt = (
            stmt.order_by(Equipment.name.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .options(selectinload(Equipment.facility))
        )

        res = await self.db.execute(stmt)
        return list(res.scalars().all()), total

    async def update_equipment(self, equipment: Equipment, update_data: Dict[str, Any]) -> Equipment:
        for field, val in update_data.items():
            if val is not None and hasattr(equipment, field):
                setattr(equipment, field, val)
        await self.db.flush()
        return equipment

    async def delete_equipment(self, equipment: Equipment) -> None:
        await self.db.delete(equipment)
        await self.db.flush()
