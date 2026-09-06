import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.users import User
from app.schemas.matching import MatchingAnalyzeRequest, MatchingAnalyzeResponse
from app.agents.matching_agent import MatchingAgent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/matching", tags=["Matching & Explanation Intelligence"])
matching_agent = MatchingAgent()


@router.post(
    "/analyze",
    response_model=MatchingAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate candidate relevance, aggregate evidence, generate grounded explanations, and construct Help Chain",
)
async def analyze_matching(
    body: MatchingAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Phase 8 Matching & Explanation Intelligence:
    1. Evaluates candidate relevance against natural language problem statement.
    2. Calculates normalized relevance scores (0.0 to 1.0) using 100% weighted model.
    3. Aggregates evidence while enforcing privacy controls.
    4. Generates evidence-backed explanations via Explanation Agent.
    5. Classifies actionable help types.
    6. Constructs potential Help Chain for multi-domain problems.
    """
    if not body.query or not body.query.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Query string cannot be empty.",
        )

    try:
        def _do_matching(sync_db):
            return matching_agent.evaluate(
                db=sync_db,
                current_user=current_user,
                query=body.query,
                precomputed_discovery=body.discovery,
            )

        response = await db.run_sync(_do_matching)
        return response

    except Exception as exc:
        logger.error(f"Matching analysis endpoint failure: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Matching analysis failed: {str(exc)}",
        )
