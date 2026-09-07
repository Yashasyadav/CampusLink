import logging
from typing import Optional, List, Dict, Any
from app.models.users import User
from app.agent_tools.tools import (
    search_projects_tool,
    search_research_tool,
    search_solutions_tool,
)
from app.schemas.agents import (
    ProjectKnowledgeResult,
    Evidence,
    QueryUnderstandingResult,
)
from app.services.llm_provider import get_llm_provider, LLMProvider

logger = logging.getLogger(__name__)


class ProjectKnowledgeDiscoveryAgent:
    """Specialized investigator agent for discovering projects, research, and problem solutions."""

    def __init__(self, provider: Optional[LLMProvider] = None):
        self.provider = provider or get_llm_provider()

    def discover(
        self,
        db: Any,
        current_user: User,
        query_understanding: QueryUnderstandingResult,
        limit: int = 5,
    ) -> ProjectKnowledgeResult:
        """Find projects, research, and solutions backed by Phase 6 search evidence."""
        query = query_understanding.original_query
        projects_list: List[Dict[str, Any]] = []
        research_list: List[Dict[str, Any]] = []
        solutions_list: List[Dict[str, Any]] = []
        evidence_list: List[Evidence] = []

        try:
            # 1. Search Projects
            if query_understanding.needs_projects:
                proj_res = search_projects_tool(db, current_user, query, limit=limit)
                for item in proj_res.results:
                    projects_list.append({
                        "id": str(item.entity_id),
                        "title": item.title,
                        "snippet": item.snippet,
                        "score": item.score,
                        "metadata": item.metadata,
                    })
                    evidence_list.append(Evidence(
                        entity_type="PROJECT",
                        entity_id=item.entity_id,
                        title=item.title,
                        source="search_projects_tool",
                        snippet=item.snippet,
                        score=item.score,
                    ))

            # 2. Search Research
            res_search = search_research_tool(db, current_user, query, limit=limit)
            for item in res_search.results:
                research_list.append({
                    "id": str(item.entity_id),
                    "title": item.title,
                    "snippet": item.snippet,
                    "score": item.score,
                    "metadata": item.metadata,
                })
                evidence_list.append(Evidence(
                    entity_type="RESEARCH",
                    entity_id=item.entity_id,
                    title=item.title,
                    source="search_research_tool",
                    snippet=item.snippet,
                    score=item.score,
                ))

            # 3. Search Problem / Solutions
            if query_understanding.needs_solutions:
                sol_search = search_solutions_tool(db, current_user, query, limit=limit)
                for item in sol_search.results:
                    solutions_list.append({
                        "id": str(item.entity_id),
                        "title": item.title,
                        "snippet": item.snippet,
                        "score": item.score,
                        "metadata": item.metadata,
                    })
                    evidence_list.append(Evidence(
                        entity_type="PROBLEM_SOLUTION",
                        entity_id=item.entity_id,
                        title=item.title,
                        source="search_solutions_tool",
                        snippet=item.snippet,
                        score=item.score,
                    ))

            return ProjectKnowledgeResult(
                projects=projects_list,
                research=research_list,
                solutions=solutions_list,
                evidence=evidence_list,
                status="SUCCESS",
            )

        except Exception as exc:
            logger.error(f"Project & knowledge discovery agent error: {exc}")
            return ProjectKnowledgeResult(
                projects=[], research=[], solutions=[], evidence=[], status="FAILED"
            )
