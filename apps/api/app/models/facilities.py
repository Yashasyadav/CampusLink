import enum
import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.users import User


class FacilityStatus(str, enum.Enum):
    OPERATIONAL = "OPERATIONAL"
    MAINTENANCE = "MAINTENANCE"
    RESTRICTED = "RESTRICTED"


class EquipmentStatus(str, enum.Enum):
    OPERATIONAL = "OPERATIONAL"
    UNDER_REPAIR = "UNDER_REPAIR"
    DECOMMISSIONED = "DECOMMISSIONED"


class AvailabilityStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    IN_USE = "IN_USE"


class Facility(Base, TimestampMixin):
    """Campus laboratory / workshop / computing facility entity."""

    __tablename__ = "facilities"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    facility_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    building: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    floor: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    capabilities: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    responsible_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[FacilityStatus] = mapped_column(
        Enum(FacilityStatus, name="facility_status_enum", native_enum=False),
        default=FacilityStatus.OPERATIONAL,
        nullable=False,
    )
    availability_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    responsible_user: Mapped[Optional["User"]] = relationship("User")
    equipment: Mapped[List["Equipment"]] = relationship(
        "Equipment", back_populates="facility", cascade="all, delete-orphan"
    )


class Equipment(Base, TimestampMixin):
    """Specialized lab equipment / hardware asset entity."""

    __tablename__ = "equipment"

    facility_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("facilities.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    capability: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[EquipmentStatus] = mapped_column(
        Enum(EquipmentStatus, name="equipment_status_enum", native_enum=False),
        default=EquipmentStatus.OPERATIONAL,
        nullable=False,
    )
    availability_status: Mapped[AvailabilityStatus] = mapped_column(
        Enum(AvailabilityStatus, name="availability_status_enum", native_enum=False),
        default=AvailabilityStatus.AVAILABLE,
        nullable=False,
    )

    # Relationship
    facility: Mapped["Facility"] = relationship("Facility", back_populates="equipment")
