import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator
from email_validator import validate_email, EmailNotValidError
from app.models.users import UserRole, UserStatus


def validate_campus_email(v: str) -> str:
    """Validates campus email allowing synthetic test TLDs (.test)."""
    if not isinstance(v, str):
        raise ValueError("Email address must be a string.")
    v = v.strip().lower()
    try:
        validated = validate_email(v, check_deliverability=False, test_environment=True)
        return validated.normalized
    except EmailNotValidError as e:
        raise ValueError(str(e))


class RegisterRequest(BaseModel):
    """Public user registration request payload."""

    email: str = Field(..., description="Valid campus email address")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    role: UserRole = Field(default=UserRole.STUDENT, description="Target account role")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return validate_campus_email(v)

    @field_validator("role")
    @classmethod
    def restrict_admin_role(cls, v: UserRole) -> UserRole:
        if v == UserRole.ADMIN:
            raise ValueError("Public registration for ADMIN accounts is not permitted.")
        return v


class LoginRequest(BaseModel):
    """User login request payload."""

    email: str = Field(..., description="Registered email address")
    password: str = Field(..., description="User password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return validate_campus_email(v)


class UserResponse(BaseModel):
    """Safe user profile response payload (no passwords/hashes)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    role: UserRole
    status: UserStatus
    email_verified: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None
    profile_completed: bool = False

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return validate_campus_email(v)


class AuthResponse(BaseModel):
    """Authentication action response payload."""

    user: UserResponse
    message: str = "Success"

