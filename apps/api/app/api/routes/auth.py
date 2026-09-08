from fastapi import APIRouter, Depends, Response, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.config import settings
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    CaptchaRefreshRequest,
    UserResponse,
    AuthResponse,
)
from app.services.auth_service import AuthService
from app.services.captcha_service import CaptchaService
from app.api.deps import get_current_user
from app.models.users import User
from app.core.exceptions import CampusLinkException

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get(
    "/captcha",
    summary="Create a one-time CAPTCHA challenge",
)
async def get_captcha(db: AsyncSession = Depends(get_db)) -> dict:
    """Returns the next CAPTCHA image and opaque one-time challenge token."""
    captcha_service = CaptchaService(db)
    captcha = await captcha_service.create_challenge()
    return {"success": True, "captcha": captcha}


@router.post(
    "/captcha/refresh",
    summary="Consume current CAPTCHA and issue the next challenge",
)
async def refresh_captcha(
    payload: CaptchaRefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Invalidates the current challenge if present, then returns a fresh one."""
    captcha_service = CaptchaService(db)
    captcha = await captcha_service.refresh_challenge(payload.captcha_token)
    return {"success": True, "captcha": captcha}


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Sets secure HttpOnly cookies on response object."""
    response.set_cookie(
        key="campuslink_access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="campuslink_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    """Clears authentication cookies on response object."""
    response.delete_cookie(key="campuslink_access_token", path="/")
    response.delete_cookie(key="campuslink_refresh_token", path="/")


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(
    payload: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """Registers a new user account, creates default profile, and issues HttpOnly auth cookies."""
    auth_service = AuthService(db)
    try:
        user = await auth_service.register_user(
            email=payload.email,
            password=payload.password,
            role=payload.role,
        )
        access_token, refresh_token = await auth_service.issue_tokens_for_user(user)

        set_auth_cookies(response, access_token, refresh_token)
        profile_completed = auth_service.calculate_profile_completion(user, user.profile)

        user_resp = UserResponse.model_validate(user)
        user_resp.profile_completed = profile_completed

        return AuthResponse(
            user=user_resp,
            message="User account registered successfully.",
        )

    except CampusLinkException as e:
        if e.code == "ACCOUNT_EXISTS":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=e.message,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Authenticate user and obtain HttpOnly session cookies",
)
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse | JSONResponse:
    """Authenticates credentials and sets HttpOnly auth cookies."""
    auth_service = AuthService(db)
    captcha_service = CaptchaService(db)
    captcha_valid = await captcha_service.consume_and_validate(
        payload.captcha_token,
        payload.captcha_value,
    )
    if not captcha_valid:
        next_captcha = await captcha_service.create_challenge()
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": "captcha_invalid",
                "message": "Incorrect CAPTCHA. Please try again.",
                "nextCaptcha": next_captcha,
            },
        )

    try:
        user, access_token, refresh_token = await auth_service.authenticate_user(
            email=payload.email, password=payload.password
        )

        set_auth_cookies(response, access_token, refresh_token)
        profile_completed = auth_service.calculate_profile_completion(user, user.profile)

        user_resp = UserResponse.model_validate(user)
        user_resp.profile_completed = profile_completed

        return AuthResponse(
            user=user_resp,
            message="Login successful.",
        )

    except CampusLinkException as e:
        next_captcha = await captcha_service.create_challenge()
        if e.code == "ACCOUNT_DISABLED":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "error": "authentication_failed",
                    "message": "Invalid email or password.",
                    "nextCaptcha": next_captcha,
                },
            )
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "success": False,
                "error": "authentication_failed",
                "message": "Invalid email or password.",
                "nextCaptcha": next_captcha,
            },
        )


@router.post(
    "/logout",
    summary="Log out user and clear authentication cookies",
)
async def logout(response: Response) -> dict:
    """Clears authentication cookies and invalidates session state."""
    clear_auth_cookies(response)
    return {"message": "Logged out successfully."}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user information",
)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Returns safe information about the current authenticated user."""
    auth_service = AuthService(db)
    profile_completed = auth_service.calculate_profile_completion(
        current_user, current_user.profile
    )

    user_resp = UserResponse.model_validate(current_user)
    user_resp.profile_completed = profile_completed
    return user_resp
