import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.users import User
from app.schemas.agents import DiscoveryRequest, DiscoveryResponse
from app.graph.execution import GraphExecutionService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["Agentic Discovery"])
graph_execution_service = GraphExecutionService()


@router.post(
    "/discover",
    response_model=DiscoveryResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute agentic campus discovery investigation across people, projects, and resources via LangGraph",
)
async def discover_campus_knowledge(
    body: DiscoveryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Run Phase 9 LangGraph stateful workflow orchestration:
    1. Initialize request & query understanding.
    2. Dynamic parallel discovery fan-out (People, Knowledge, Facilities).
    3. Aggregate evidence & evaluate matching.
    4. Validate security, schemas, and return DiscoveryResponse with trace.
    """
    try:
        def _do_discover(sync_db):
            return graph_execution_service.run_workflow(
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

