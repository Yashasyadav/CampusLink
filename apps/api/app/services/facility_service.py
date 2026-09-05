import uuid
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.users import User, UserRole
from app.models.facilities import Facility, Equipment, FacilityStatus, EquipmentStatus, AvailabilityStatus, FacilityVisibility, EquipmentVisibility
from app.repositories.facility_repository import FacilityRepository
from app.schemas.facilities import FacilityCreate, FacilityUpdate, FacilityResponse, EquipmentBriefResponse
from app.schemas.equipment import EquipmentCreate, EquipmentUpdate, EquipmentResponse


class FacilityService:
    """Service layer enforcing lab facility and equipment management permissions."""

    @staticmethod
    def _can_manage_facility(facility: Optional[Facility], current_user: User) -> bool:
        if current_user.role == UserRole.ADMIN:
            return True
        if current_user.role == UserRole.FACULTY:
            if facility is None or facility.responsible_user_id == current_user.id or facility.responsible_user_id is None:
                return True
        return False

    @staticmethod
    def to_facility_schema(facility: Facility) -> FacilityResponse:
        resp_name = facility.responsible_user.profile.full_name if facility.responsible_user and facility.responsible_user.profile else None

        eq_brief = [
            EquipmentBriefResponse(
                id=eq.id,
                name=eq.name,
                category=eq.category,
                quantity=eq.quantity,
                status=eq.status.value,
                availability_status=eq.availability_status.value,
            )
            for eq in facility.equipment
        ]

        return FacilityResponse(
            id=facility.id,
            name=facility.name,
            facility_type=facility.facility_type,
            location=facility.location,
            building=facility.building,
            floor=facility.floor,
            department=facility.department,
            contact_email=facility.contact_email,
            operating_hours=facility.operating_hours,
            description=facility.description,
            capabilities=facility.capabilities,
            responsible_user_id=facility.responsible_user_id,
            responsible_user_name=resp_name,
            status=facility.status,
            availability_notes=facility.availability_notes,
            visibility=facility.visibility,
            created_at=facility.created_at,
            updated_at=facility.updated_at,
            equipment_count=len(facility.equipment),
            equipment=eq_brief,
        )

    @staticmethod
    def to_equipment_schema(equipment: Equipment) -> EquipmentResponse:
        fac_name = equipment.facility.name if equipment.facility else None
        return EquipmentResponse(
            id=equipment.id,
            facility_id=equipment.facility_id,
            facility_name=fac_name,
            name=equipment.name,
            category=equipment.category,
            description=equipment.description,
            capability=equipment.capability,
            quantity=equipment.quantity,
            status=equipment.status,
            availability_status=equipment.availability_status,
            visibility=equipment.visibility,
            created_at=equipment.created_at,
            updated_at=equipment.updated_at,
        )

    # Facility Methods
    async def create_facility(
        self, db: AsyncSession, current_user: User, data: FacilityCreate
    ) -> FacilityResponse:
        if not self._can_manage_facility(None, current_user):
            raise PermissionError("Access denied: Only Faculty and Admin users can create facility records.")

        repo = FacilityRepository(db)
        fac = await repo.create_facility(
            name=data.name,
            facility_type=data.facility_type,
            location=data.location,
            building=data.building,
            floor=data.floor,
            department=data.department,
            contact_email=data.contact_email,
            operating_hours=data.operating_hours,
            description=data.description,
            capabilities=data.capabilities,
            responsible_user_id=data.responsible_user_id or current_user.id,
            status=data.status,
            availability_notes=data.availability_notes,
            visibility=data.visibility,
        )
        full_fac = await repo.get_facility_by_id(fac.id)
        return self.to_facility_schema(full_fac)

    async def get_facility(
        self, db: AsyncSession, current_user: User, facility_id: uuid.UUID
    ) -> FacilityResponse:
        repo = FacilityRepository(db)
        fac = await repo.get_facility_by_id(facility_id)
        if not fac:
            raise ValueError("Facility not found.")
        return self.to_facility_schema(fac)

    async def list_facilities(
        self,
        db: AsyncSession,
        current_user: User,
        page: int = 1,
        page_size: int = 20,
        facility_type: Optional[str] = None,
        status: Optional[FacilityStatus] = None,
    ) -> Tuple[List[FacilityResponse], int]:
        repo = FacilityRepository(db)
        vis_filter = [FacilityVisibility.PUBLIC, FacilityVisibility.CAMPUS_ONLY]

        facilities, total = await repo.list_facilities(
            page=page,
            page_size=page_size,
            facility_type=facility_type,
            status=status,
            visibility_filter=vis_filter,
        )
        items = [self.to_facility_schema(f) for f in facilities]
        return items, total

    async def update_facility(
        self, db: AsyncSession, current_user: User, facility_id: uuid.UUID, data: FacilityUpdate
    ) -> FacilityResponse:
        repo = FacilityRepository(db)
        fac = await repo.get_facility_by_id(facility_id)
        if not fac:
            raise ValueError("Facility not found.")

        if not self._can_manage_facility(fac, current_user):
            raise PermissionError("Access denied: You are not authorized to update this facility.")

        update_dict = data.model_dump(exclude_unset=True)
        await repo.update_facility(fac, update_dict)
        updated = await repo.get_facility_by_id(facility_id)
        return self.to_facility_schema(updated)

    async def delete_facility(
        self, db: AsyncSession, current_user: User, facility_id: uuid.UUID
    ) -> None:
        repo = FacilityRepository(db)
        fac = await repo.get_facility_by_id(facility_id)
        if not fac:
            raise ValueError("Facility not found.")

        if not self._can_manage_facility(fac, current_user):
            raise PermissionError("Access denied: You are not authorized to delete this facility.")

        await repo.delete_facility(fac)

    # Equipment Methods
    async def create_equipment(
        self, db: AsyncSession, current_user: User, facility_id: uuid.UUID, data: EquipmentCreate
    ) -> EquipmentResponse:
        repo = FacilityRepository(db)
        fac = await repo.get_facility_by_id(facility_id)
        if not fac:
            raise ValueError("Target facility not found.")

        if not self._can_manage_facility(fac, current_user):
            raise PermissionError("Access denied: Only lab managers can add equipment.")

        eq = await repo.create_equipment(
            facility_id=facility_id,
            name=data.name,
            category=data.category,
            description=data.description,
            capability=data.capability,
            quantity=data.quantity,
            status=data.status,
            availability_status=data.availability_status,
            visibility=data.visibility,
        )
        full_eq = await repo.get_equipment_by_id(eq.id)
        return self.to_equipment_schema(full_eq)

    async def get_equipment(
        self, db: AsyncSession, current_user: User, equipment_id: uuid.UUID
    ) -> EquipmentResponse:
        repo = FacilityRepository(db)
        eq = await repo.get_equipment_by_id(equipment_id)
        if not eq:
            raise ValueError("Equipment asset not found.")
        return self.to_equipment_schema(eq)

    async def list_equipment(
        self,
        db: AsyncSession,
        current_user: User,
        facility_id: Optional[uuid.UUID] = None,
        category: Optional[str] = None,
        status: Optional[EquipmentStatus] = None,
        availability_status: Optional[AvailabilityStatus] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[EquipmentResponse], int]:
        repo = FacilityRepository(db)
        vis_filter = [EquipmentVisibility.PUBLIC, EquipmentVisibility.CAMPUS_ONLY]

        equipment_list, total = await repo.list_equipment(
            facility_id=facility_id,
            category=category,
            status=status,
            availability_status=availability_status,
            visibility_filter=vis_filter,
            page=page,
            page_size=page_size,
        )
        items = [self.to_equipment_schema(e) for e in equipment_list]
        return items, total

    async def update_equipment(
        self, db: AsyncSession, current_user: User, equipment_id: uuid.UUID, data: EquipmentUpdate
    ) -> EquipmentResponse:
        repo = FacilityRepository(db)
        eq = await repo.get_equipment_by_id(equipment_id)
        if not eq:
            raise ValueError("Equipment asset not found.")

        if not self._can_manage_facility(eq.facility, current_user):
            raise PermissionError("Access denied: You are not authorized to update equipment.")

        update_dict = data.model_dump(exclude_unset=True)
        await repo.update_equipment(eq, update_dict)
        updated = await repo.get_equipment_by_id(equipment_id)
        return self.to_equipment_schema(updated)

    async def delete_equipment(
        self, db: AsyncSession, current_user: User, equipment_id: uuid.UUID
    ) -> None:
        repo = FacilityRepository(db)
        eq = await repo.get_equipment_by_id(equipment_id)
        if not eq:
            raise ValueError("Equipment asset not found.")

        if not self._can_manage_facility(eq.facility, current_user):
            raise PermissionError("Access denied: You are not authorized to delete equipment.")

        await repo.delete_equipment(eq)
