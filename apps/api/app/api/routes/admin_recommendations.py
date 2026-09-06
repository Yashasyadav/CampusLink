import uuid
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role, get_db
from app.models.users import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.feedback import (
    QualityMetricsResponse,
    AdminRecommendationItem,
    AdminRecommendationDetailResponse,
)
from app.services.recommendation_quality_service import RecommendationQualityService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/recommendations", tags=["Admin Recommendation Quality"])


@router.get(
    "/metrics",
    response_model=QualityMetricsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get aggregate recommendation quality and feedback metrics (Admin only)",
)
async def get_recommendation_quality_metrics(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns aggregate recommendation quality reporting metrics for system auditing.
    Requires ADMIN role.
    """
    quality_service = RecommendationQualityService(db)
    return await quality_service.get_admin_metrics()


@router.get(
    "",
    response_model=PaginatedResponse[AdminRecommendationItem],
    status_code=status.HTTP_200_OK,
    summary="List recommendation events with quality flags and user feedback (Admin only)",
)
async def list_admin_recommendations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    entity_type: Optional[str] = Query(default=None),
    has_feedback: Optional[bool] = Query(default=None),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    List surfaced recommendation events for administrative auditing.
    Requires ADMIN role.
    """
    offset = (page - 1) * page_size
    quality_service = RecommendationQualityService(db)
    items, total = await quality_service.list_admin_recommendations(
        limit=page_size, offset=offset, entity_type=entity_type, has_feedback=has_feedback
    )

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 0,
    )


@router.get(
    "/{recommendation_id}",
    response_model=AdminRecommendationDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Safe administrative detail inspection of a recommendation event (Admin only)",
)
async def get_admin_recommendation_detail(
    recommendation_id: uuid.UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    Inspect structured recommendation evidence, score components, and feedback.
    Never exposes raw private resumes, model tokens, or raw prompts.
    Requires ADMIN role.
    """
    quality_service = RecommendationQualityService(db)
    try:
        return await quality_service.get_admin_recommendation_detail(recommendation_id)
    except KeyError as e_not_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e_not_found),
        )
