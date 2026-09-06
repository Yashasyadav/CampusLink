import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.users import User
from app.schemas.feedback import FeedbackSubmitRequest, FeedbackResponse
from app.services.recommendation_quality_service import RecommendationQualityService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feedback/recommendations", tags=["Recommendation Feedback"])


@router.post(
    "/{recommendation_id}",
    response_model=FeedbackResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit or update user feedback for a surfaced recommendation event",
)
async def submit_recommendation_feedback(
    recommendation_id: uuid.UUID,
    body: FeedbackSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Record or update feedback for a recommendation event.
    Enforces server-side IDOR authorization: user can ONLY submit feedback for recommendations surfaced to them.
    """
    quality_service = RecommendationQualityService(db)
    try:
        res = await quality_service.submit_feedback(
            current_user=current_user,
            recommendation_id=recommendation_id,
            payload=body,
        )
        await db.commit()
        return res

    except KeyError as e_not_found:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e_not_found),
        )
    except ValueError as e_idor:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e_idor),
        )
    except Exception as exc:
        await db.rollback()
        logger.error(f"Feedback submission failure: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit recommendation feedback: {str(exc)}",
        )


@router.get(
    "/{recommendation_id}",
    response_model=FeedbackResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user's existing feedback for a recommendation event",
)
async def get_recommendation_feedback(
    recommendation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get authenticated user's feedback record for a recommendation event."""
    quality_service = RecommendationQualityService(db)
    try:
        res = await quality_service.get_user_feedback(current_user, recommendation_id)
        if not res:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No feedback found for this recommendation event.",
            )
        return res
    except KeyError as e_not_found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e_not_found),
        )
    except ValueError as e_idor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e_idor),
        )
