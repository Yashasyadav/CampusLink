import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.facilities import EquipmentStatus, AvailabilityStatus, EquipmentVisibility


class EquipmentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    category: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    capability: Optional[str] = None
    quantity: int = Field(default=1, ge=0)
    status: EquipmentStatus = Field(default=EquipmentStatus.OPERATIONAL)
    availability_status: AvailabilityStatus = Field(default=AvailabilityStatus.AVAILABLE)
    visibility: EquipmentVisibility = Field(default=EquipmentVisibility.CAMPUS_ONLY)


class EquipmentUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    category: Optional[str] = None
    description: Optional[str] = None
    capability: Optional[str] = None
    quantity: Optional[int] = Field(default=None, ge=0)
    status: Optional[EquipmentStatus] = None
    availability_status: Optional[AvailabilityStatus] = None
    visibility: Optional[EquipmentVisibility] = None


class EquipmentResponse(BaseModel):
    id: uuid.UUID
    facility_id: uuid.UUID
    facility_name: Optional[str] = None
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    capability: Optional[str] = None
    quantity: int
    status: EquipmentStatus
    availability_status: AvailabilityStatus
    visibility: EquipmentVisibility
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
