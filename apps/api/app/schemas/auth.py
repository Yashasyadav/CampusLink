import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from app.models.users import UserRole, UserStatus


class RegisterRequest(BaseModel):
    """Public user registration request payload."""

    email: EmailStr = Field(..., description="Valid campus email address")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    role: UserRole = Field(default=UserRole.STUDENT, description="Target account role")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()

    @field_validator("role")
    @classmethod
    def restrict_admin_role(cls, v: UserRole) -> UserRole:
        if v == UserRole.ADMIN:
            raise ValueError("Public registration for ADMIN accounts is not permitted.")
        return v


class LoginRequest(BaseModel):
    """User login request payload."""

    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="User password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(BaseModel):
    """Safe user profile response payload (no passwords/hashes)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    role: UserRole
    status: UserStatus
    email_verified: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None
    profile_completed: bool = False


class AuthResponse(BaseModel):
    """Authentication action response payload."""

    user: UserResponse
    message: str = "Success"
