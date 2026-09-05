import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.profiles import ContactVisibility


class ProfileResponse(BaseModel):
    """Safe user profile response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    full_name: str
    profile_photo_url: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    designation: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None

    # Privacy Settings
    searchable: bool
    contact_visibility: ContactVisibility
    show_email: bool
    show_phone: bool
    show_social_links: bool
    profile_completed: bool

    created_at: datetime
    updated_at: datetime


class ProfileUpdateRequest(BaseModel):
    """Payload for updating user profile and privacy settings."""

    full_name: Optional[str] = Field(None, max_length=255)
    profile_photo_url: Optional[str] = Field(None, max_length=1024)
    department: Optional[str] = Field(None, max_length=255)
    year: Optional[int] = Field(None, ge=1, le=8)
    designation: Optional[str] = Field(None, max_length=255)
    bio: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=255)
    github_url: Optional[str] = Field(None, max_length=512)
    linkedin_url: Optional[str] = Field(None, max_length=512)
    portfolio_url: Optional[str] = Field(None, max_length=512)

    # Privacy & Visibility Updates
    searchable: Optional[bool] = None
    contact_visibility: Optional[ContactVisibility] = None
    show_email: Optional[bool] = None
    show_phone: Optional[bool] = None
    show_social_links: Optional[bool] = None
