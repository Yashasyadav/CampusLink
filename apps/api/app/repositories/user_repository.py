import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.users import User, UserRole, UserStatus


class UserRepository:
    """Repository handling User database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Fetch user by ID with profile relationship pre-loaded."""
        stmt = select(User).options(selectinload(User.profile)).filter_by(id=user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetch user by normalized email address."""
        stmt = select(User).options(selectinload(User.profile)).filter_by(email=email.strip().lower())
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(
        self,
        email: str,
        password_hash: str,
        role: UserRole = UserRole.STUDENT,
        status: UserStatus = UserStatus.ACTIVE,
    ) -> User:
        """Persists a new user record."""
        user = User(
            email=email.strip().lower(),
            password_hash=password_hash,
            role=role,
            status=status,
            email_verified=False,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_last_login(self, user_id: uuid.UUID) -> None:
        """Updates last_login_at timestamp for authenticated user."""
        user = await self.get_by_id(user_id)
        if user:
            user.last_login_at = datetime.now(timezone.utc)
            await self.db.commit()
