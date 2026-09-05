from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.profile import ProfileResponse, ProfileUpdateRequest
from app.services.auth_service import AuthService
from app.repositories.profile_repository import ProfileRepository
from app.api.deps import get_current_user
from app.models.users import User

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get(
    "/me",
    response_model=ProfileResponse,
    summary="Get authenticated user profile",
)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    """Returns the full profile and privacy settings for the current user."""
    profile_repo = ProfileRepository(db)
    profile = await profile_repo.get_by_user_id(current_user.id)

    if not profile:
        profile = await profile_repo.create_default_profile(
            user_id=current_user.id,
            default_name=current_user.email.split("@")[0].title(),
        )

    profile_completed = AuthService.calculate_profile_completion(current_user, profile)
    resp = ProfileResponse.model_validate(profile)
    resp.profile_completed = profile_completed
    return resp


@router.patch(
    "/me",
    response_model=ProfileResponse,
    summary="Update authenticated user profile and privacy settings",
)
async def update_my_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProfileResponse:
    """Updates profile attributes and privacy settings for the authenticated user."""
    profile_repo = ProfileRepository(db)
    profile = await profile_repo.get_by_user_id(current_user.id)

    if not profile:
        profile = await profile_repo.create_default_profile(
            user_id=current_user.id,
            default_name=current_user.email.split("@")[0].title(),
        )

    update_dict = payload.model_dump(exclude_unset=True)
    updated_profile = await profile_repo.update(profile, update_dict)

    profile_completed = AuthService.calculate_profile_completion(
        current_user, updated_profile
    )
    if updated_profile.profile_completed != profile_completed:
        await profile_repo.update(updated_profile, {"profile_completed": profile_completed})

    resp = ProfileResponse.model_validate(updated_profile)
    resp.profile_completed = profile_completed
    return resp
