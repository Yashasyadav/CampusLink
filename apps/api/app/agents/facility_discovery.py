import logging
from typing import Optional, List, Dict, Any
from app.models.users import User
from app.agent_tools.tools import search_facilities_tool, search_equipment_tool
from app.schemas.agents import (
    FacilityDiscoveryResult,
    Evidence,
    QueryUnderstandingResult,
)
from app.services.llm_provider import get_llm_provider, LLMProvider

logger = logging.getLogger(__name__)


class FacilityDiscoveryAgent:
    """Specialized investigator agent for discovering campus facilities, labs, and equipment."""

    def __init__(self, provider: Optional[LLMProvider] = None):
        self.provider = provider or get_llm_provider()

    def discover(
        self,
        db: Any,
        current_user: User,
        query_understanding: QueryUnderstandingResult,
        limit: int = 5,
    ) -> FacilityDiscoveryResult:
        """Find facilities and equipment backed by Phase 6 search evidence."""
        query = query_understanding.original_query
        facilities_list: List[Dict[str, Any]] = []
        equipment_list: List[Dict[str, Any]] = []
        evidence_list: List[Evidence] = []

        try:
            # 1. Search Facilities
            fac_res = search_facilities_tool(db, current_user, query, limit=limit)
            for item in fac_res.results:
                facilities_list.append({
                    "id": str(item.entity_id),
                    "name": item.title,
                    "snippet": item.snippet,
                    "score": item.score,
                    "metadata": item.metadata,
                })
                evidence_list.append(Evidence(
                    entity_type="FACILITY",
                    entity_id=item.entity_id,
                    title=item.title,
                    source="search_facilities_tool",
                    snippet=item.snippet,
                    score=item.score,
                ))

            # 2. Search Equipment
            eq_res = search_equipment_tool(db, current_user, query, limit=limit)
            for item in eq_res.results:
                equipment_list.append({
                    "id": str(item.entity_id),
                    "name": item.title,
                    "snippet": item.snippet,
                    "score": item.score,
                    "metadata": item.metadata,
                })
                evidence_list.append(Evidence(
                    entity_type="EQUIPMENT",
                    entity_id=item.entity_id,
                    title=item.title,
                    source="search_equipment_tool",
                    snippet=item.snippet,
                    score=item.score,
                ))

            return FacilityDiscoveryResult(
                facilities=facilities_list,
                equipment=equipment_list,
                evidence=evidence_list,
                status="SUCCESS",
            )

        except Exception as exc:
            logger.error(f"Facility discovery agent error: {exc}")
            return FacilityDiscoveryResult(
                facilities=[], equipment=[], evidence=[], status="FAILED"
            )
