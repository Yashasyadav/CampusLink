"""Security and Authentication Foundation Placeholders.

Phase 1 establishes contract boundaries for authorization and permission context.
Full JWT auth implementation will occur in subsequent phases.
"""
from typing import Optional, Dict, Any


class SecurityContext:
    """Represents current request caller security context for permission checks."""

    def __init__(self, user_id: Optional[str] = None, roles: Optional[list[str]] = None):
        self.user_id = user_id
        self.roles = roles or []
        self.is_authenticated = bool(user_id)

    def has_role(self, role: str) -> bool:
        return role in self.roles
