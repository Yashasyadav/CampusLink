"""FastAPI Dependency Injection Placeholders."""
from typing import AsyncGenerator
from app.core.security import SecurityContext


async def get_security_context() -> SecurityContext:
    """Dependency placeholder providing security context for routes."""
    return SecurityContext(user_id="anonymous", roles=["guest"])
