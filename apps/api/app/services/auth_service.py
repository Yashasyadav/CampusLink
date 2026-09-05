import uuid
from typing import Tuple, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.users import User, UserRole, UserStatus
from app.models.profiles import Profile
from app.repositories.user_repository import UserRepository
from app.repositories.profile_repository import ProfileRepository
from app.core.security import hash_password, verify_password, create_token
from app.core.exceptions import CampusLinkException


class AuthService:
    """Service handling Authentication, Registration, and Onboarding completion rules."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.profile_repo = ProfileRepository(db)

    async def register_user(
        self, email: str, password: str, role: UserRole
    ) -> User:
        """Registers a new user account with Argon2id password hash and default profile."""
        existing_user = await self.user_repo.get_by_email(email)
        if existing_user:
            raise CampusLinkException(
                "An account with this email address already exists.",
                code="ACCOUNT_EXISTS",
            )

        hashed = hash_password(password)
        user = await self.user_repo.create(
            email=email,
            password_hash=hashed,
            role=role,
            status=UserStatus.ACTIVE,
        )

        # Derive initial default display name from email prefix
        default_name = email.split("@")[0].replace(".", " ").title()
        await self.profile_repo.create_default_profile(
            user_id=user.id, default_name=default_name
        )

        return user

    async def authenticate_user(
        self, email: str, password: str
    ) -> Tuple[User, str, str]:
        """Authenticates user credentials and issues access & refresh tokens."""
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise CampusLinkException(
                "Invalid email or password.",
                code="INVALID_CREDENTIALS",
            )

        if user.status != UserStatus.ACTIVE:
            raise CampusLinkException(
                f"Account is currently {user.status.value.lower()}. Please contact support.",
                code="ACCOUNT_DISABLED",
            )

        await self.user_repo.update_last_login(user.id)

        access_token = create_token(
            subject=str(user.id),
            token_type="access",
            extra_claims={"role": user.role.value},
        )
        refresh_token = create_token(
            subject=str(user.id),
            token_type="refresh",
            extra_claims={"role": user.role.value},
        )

        return user, access_token, refresh_token

    @staticmethod
    def calculate_profile_completion(user: User, profile: Optional[Profile]) -> bool:
        """Determines if user profile onboarding requirements are satisfied.

        For Phase 3:
        - Students: Name, Department, Year must be present.
        - Faculty: Name, Department, Designation must be present.
        - Alumni: Name, Department must be present.
        """
        if not profile or not profile.full_name or not profile.department:
            return False

        if user.role == UserRole.STUDENT:
            return profile.year is not None
        elif user.role == UserRole.FACULTY:
            return profile.designation is not None
        return True
