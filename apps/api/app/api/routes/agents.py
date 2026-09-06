import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.users import User
from app.schemas.agents import DiscoveryRequest, DiscoveryResponse
from app.services.agent_execution_service import AgentExecutionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["Agentic Discovery"])
execution_service = AgentExecutionService()


@router.post(
    "/discover",
    response_model=DiscoveryResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute agentic campus discovery investigation across people, projects, and resources",
)
async def discover_campus_knowledge(
    body: DiscoveryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Run Phase 7 specialized discovery investigation:
    1. Query Understanding Agent extracts intent, domains, skills, & technologies.
    2. People Discovery Agent finds evidence-backed experts.
    3. Project & Knowledge Discovery Agent finds similar projects, research, & solutions.
    4. Facility Discovery Agent finds relevant labs & equipment.
    5. Returns aggregated evidence & agent execution metadata.
    """
    try:
        def _do_discover(sync_db):
            return execution_service.discover(
                db=sync_db,
                current_user=current_user,
                query=body.query,
            )

        response = await db.run_sync(_do_discover)
        return response

    except Exception as exc:
        logger.error(f"Agent discovery endpoint failure: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent discovery investigation failed: {str(exc)}",
        )
