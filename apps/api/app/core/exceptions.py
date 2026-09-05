from typing import Any, Optional, Dict
from fastapi import HTTPException, status


class CampusLinkException(Exception):
    """Base exception class for CampusLink domain exceptions."""

    def __init__(self, message: str, code: str = "INTERNAL_ERROR", details: Optional[list] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or []


class EntityNotFoundException(CampusLinkException):
    """Raised when a requested domain entity is not found."""

    def __init__(self, entity_name: str, entity_id: Any):
        message = f"{entity_name} with identifier '{entity_id}' was not found."
        super().__init__(message, code="NOT_FOUND")


class PermissionDeniedException(CampusLinkException):
    """Raised when an operation violates permission or privacy policies."""

    def __init__(self, message: str = "Permission denied for this resource."):
        super().__init__(message, code="PERMISSION_DENIED")
