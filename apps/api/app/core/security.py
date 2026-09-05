import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from app.core.config import settings
from app.core.exceptions import CampusLinkException

# Argon2id password hasher instance (production grade parameters)
ph = PasswordHasher()


def hash_password(password: str) -> str:
    """Hashes a plaintext password using Argon2id."""
    if not password or len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against an Argon2id hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def create_token(
    subject: str,
    token_type: str = "access",
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Creates a signed JWT token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    elif token_type == "access":
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    else:
        expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": str(subject),
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    if extra_claims:
        payload.update(extra_claims)

    encoded_jwt = jwt.encode(
        payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JWT token."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise CampusLinkException("Authentication token has expired.", code="TOKEN_EXPIRED")
    except jwt.InvalidTokenError:
        raise CampusLinkException("Invalid authentication token.", code="INVALID_TOKEN")


class SecurityContext:
    """Represents caller security context for permission checks."""

    def __init__(self, user_id: Optional[str] = None, roles: Optional[List[str]] = None):
        self.user_id = user_id
        self.roles = roles or []
        self.is_authenticated = bool(user_id)

    def has_role(self, role: str) -> bool:
        return role in self.roles
