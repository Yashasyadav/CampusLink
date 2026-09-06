import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role, get_db
from app.models.users import User, UserRole
from app.schemas.search import (
    SearchQueryRequest,
    SearchQueryResponse,
    ReindexRequest,
    ReindexResponse,
)
from app.services.search_service import SearchService
from app.services.embedding_index_service import EmbeddingIndexService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["Semantic Search"])
search_service = SearchService()
indexing_service = EmbeddingIndexService()


@router.post(
    "",
    response_model=SearchQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute hybrid or semantic search across campus knowledge",
)
async def execute_search(
    body: SearchQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Search campus profiles, projects, research, facilities, equipment, and problem solutions.
    Supports SEMANTIC and HYBRID search modes.
    Enforces privacy, discovery rules, and authorization access control boundaries.
    """
    try:
        entity_types_str = (
            [et.value for et in body.entity_types] if body.entity_types else None
        )

        def _do_search(sync_db):
            return search_service.search(
                db=sync_db,
                query=body.query,
                entity_types=entity_types_str,
                mode=body.mode.value,
                limit=body.limit,
                offset=body.offset,
                user=current_user,
            )

        response = await db.run_sync(_do_search)
        return response
    except Exception as exc:
        logger.error(f"Search endpoint failure: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search execution failed: {str(exc)}",
        )


@router.post(
    "/reindex",
    response_model=ReindexResponse,
    status_code=status.HTTP_200_OK,
    summary="Rebuild campus knowledge vector index (Admin only)",
)
async def rebuild_index(
    body: Optional[ReindexRequest] = None,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger administrative reindexing operation across selected or all entity types.
    Requires ADMIN role.
    """
    try:
        entity_types_str = None
        if body and body.entity_types:
            entity_types_str = [et.value for et in body.entity_types]

        def _do_reindex(sync_db):
            return indexing_service.reindex_all(sync_db, entity_types=entity_types_str)

        report = await db.run_sync(_do_reindex)

        return ReindexResponse(
            status="SUCCESS",
            total_records=report.total_records,
            indexed_records=report.indexed_records,
            skipped_records=report.skipped_records,
            failed_records=report.failed_records,
            duration_seconds=report.duration_seconds,
            embedding_model=report.embedding_model,
            errors=report.errors,
        )
    except Exception as exc:
        logger.error(f"Reindexing failure: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Reindexing failed: {str(exc)}",
        )
