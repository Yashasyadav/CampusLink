import logging
from typing import Optional, List, Any
from app.models.users import User
from app.agent_tools.tools import search_people_tool, get_profile_tool
from app.schemas.agents import (
    PeopleDiscoveryResult,
    PeopleCandidate,
    Evidence,
    QueryUnderstandingResult,
)
from app.services.llm_provider import get_llm_provider, LLMProvider

logger = logging.getLogger(__name__)


class PeopleDiscoveryAgent:
    """Specialized investigator agent for discovering evidence-backed campus people."""

    def __init__(self, provider: Optional[LLMProvider] = None):
        self.provider = provider or get_llm_provider()

    def discover(
        self,
        db: Any,
        current_user: User,
        query_understanding: QueryUnderstandingResult,
        limit: int = 5,
    ) -> PeopleDiscoveryResult:
        """Find people candidates backed by Phase 6 search evidence."""
        query = query_understanding.original_query
        try:
            # 1. Invoke controlled search tool
            search_res = search_people_tool(db, current_user, query, limit=limit)
            candidates: List[PeopleCandidate] = []

            for item in search_res.results:
                # 2. Get profile details via tool
                profile_info = get_profile_tool(db, current_user, item.entity_id)
                if not profile_info:
                    continue

                # Match skills against query_understanding skills
                matched_skills = [
                    s for s in query_understanding.skills
                    if s.lower() in (profile_info.get("bio") or "").lower()
                ]

                evidence_item = Evidence(
                    entity_type="PROFILE",
                    entity_id=item.entity_id,
                    title=profile_info["full_name"],
                    source="search_people_tool",
                    snippet=item.snippet,
                    score=item.score,
                )

                candidate = PeopleCandidate(
                    user_id=profile_info["user_id"],
                    display_name=profile_info["full_name"],
                    department=profile_info.get("department"),
                    matched_skills=matched_skills or query_understanding.skills[:2],
                    evidence=[evidence_item],
                )
                candidates.append(candidate)

            summary = f"Discovered {len(candidates)} evidence-backed people candidates."
            return PeopleDiscoveryResult(
                candidates=candidates, status="SUCCESS", summary=summary
            )

        except Exception as exc:
            logger.error(f"People discovery agent error: {exc}")
            return PeopleDiscoveryResult(
                candidates=[], status="FAILED", summary=f"People discovery error: {str(exc)}"
            )
