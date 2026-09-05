import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.facilities import FacilityStatus, FacilityVisibility


class EquipmentBriefResponse(BaseModel):
    id: uuid.UUID
    name: str
    category: Optional[str] = None
    quantity: int
    status: str
    availability_status: str

    class Config:
        from_attributes = True


class FacilityCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    facility_type: str = Field(..., min_length=2, max_length=100)
    location: str = Field(..., min_length=2, max_length=255)
    building: Optional[str] = Field(default=None, max_length=100)
    floor: Optional[str] = Field(default=None, max_length=50)
    department: Optional[str] = Field(default=None, max_length=255)
    contact_email: Optional[str] = Field(default=None, max_length=255)
    operating_hours: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    capabilities: Optional[str] = None
    responsible_user_id: Optional[uuid.UUID] = None
    status: FacilityStatus = Field(default=FacilityStatus.OPERATIONAL)
    availability_notes: Optional[str] = None
    visibility: FacilityVisibility = Field(default=FacilityVisibility.CAMPUS_ONLY)


class FacilityUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    facility_type: Optional[str] = None
    location: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[str] = None
    department: Optional[str] = None
    contact_email: Optional[str] = None
    operating_hours: Optional[str] = None
    description: Optional[str] = None
    capabilities: Optional[str] = None
    responsible_user_id: Optional[uuid.UUID] = None
    status: Optional[FacilityStatus] = None
    availability_notes: Optional[str] = None
    visibility: Optional[FacilityVisibility] = None


class FacilityResponse(BaseModel):
    id: uuid.UUID
    name: str
    facility_type: str
    location: str
    building: Optional[str] = None
    floor: Optional[str] = None
    department: Optional[str] = None
    contact_email: Optional[str] = None
    operating_hours: Optional[str] = None
    description: Optional[str] = None
    capabilities: Optional[str] = None
    responsible_user_id: Optional[uuid.UUID] = None
    responsible_user_name: Optional[str] = None
    status: FacilityStatus
    availability_notes: Optional[str] = None
    visibility: FacilityVisibility
    created_at: datetime
    updated_at: datetime
    equipment_count: int = 0
    equipment: List[EquipmentBriefResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
