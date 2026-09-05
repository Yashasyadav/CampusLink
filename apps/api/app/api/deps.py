import uuid
from typing import Optional, Callable
from fastapi import Depends, Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.security import decode_token
from app.models.users import User, UserRole, UserStatus
from app.repositories.user_repository import UserRepository
from app.core.exceptions import CampusLinkException

bearer_scheme = HTTPBearer(auto_error=False)


async def get_token_from_request(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> str:
    """Extracts JWT token from HttpOnly cookie or Authorization Bearer header."""
    # 1. Try HttpOnly Cookie first
    token = request.cookies.get("campuslink_access_token")
    if token:
        return token

    # 2. Try Bearer header second
    if credentials and credentials.credentials:
        return credentials.credentials

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please log in.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    token: str = Depends(get_token_from_request),
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency resolving the current authenticated user."""
    try:
        payload = decode_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token payload.",
            )

        user_id = uuid.UUID(user_id_str)
        user_repo = UserRepository(db)
        user = await user_repo.get_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authenticated user no longer exists.",
            )

        return user

    except CampusLinkException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format in token.",
        )


async def require_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensures current authenticated user account status is ACTIVE."""
    if current_user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {current_user.status.value.lower()}.",
        )
    return current_user


def require_role(*allowed_roles: UserRole) -> Callable:
    """Dependency factory enforcing server-side role authorization."""
    async def role_checker(
        current_user: User = Depends(require_active_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied for role '{current_user.role.value}'. Requires one of: {[r.value for r in allowed_roles]}",
            )
        return current_user

    return role_checker
