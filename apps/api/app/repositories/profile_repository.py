import uuid
from typing import Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.profiles import Profile, ContactVisibility


class ProfileRepository:
    """Repository handling Profile database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_id(self, user_id: uuid.UUID) -> Optional[Profile]:
        """Fetch profile associated with a given user_id."""
        stmt = select(Profile).filter_by(user_id=user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_default_profile(
        self, user_id: uuid.UUID, default_name: str
    ) -> Profile:
        """Creates initial empty profile upon user registration."""
        profile = Profile(
            user_id=user_id,
            full_name=default_name,
            searchable=True,
            contact_visibility=ContactVisibility.CONNECTIONS_ONLY,
            profile_completed=False,
        )
        self.db.add(profile)
        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def update(self, profile: Profile, update_data: Dict[str, Any]) -> Profile:
        """Applies updates to a profile entity."""
        for field, value in update_data.items():
            if value is not None and hasattr(profile, field):
                setattr(profile, field, value)

        await self.db.commit()
        await self.db.refresh(profile)
        return profile
