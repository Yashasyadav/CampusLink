import math
from typing import Generic, List, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Pagination request query parameters."""

    page: int = Field(default=1, ge=1, description="Page number starting from 1")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page (max 100)")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated metadata response wrapper."""

    items: List[T]
    total: int = Field(..., description="Total count of items matching query")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")

    @classmethod
    def create(cls, items: List[T], total: int, page: int, page_size: int):
        total_pages = math.ceil(total / page_size) if page_size > 0 and total > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
