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
        candidate_pool_limit = max(limit * 2, 10)
        query = query_understanding.original_query
        projects_list: List[Dict[str, Any]] = []
        research_list: List[Dict[str, Any]] = []
        solutions_list: List[Dict[str, Any]] = []
        evidence_list: List[Evidence] = []
        seen_proj_ids = set()
        seen_res_ids = set()
        seen_sol_ids = set()

        search_queries = [query]
        if query_understanding.technologies:
            tech_q = " ".join(query_understanding.technologies)
            if tech_q not in search_queries:
                search_queries.append(tech_q)
        if query_understanding.skills:
            skill_q = " ".join(query_understanding.skills)
            if skill_q not in search_queries:
                search_queries.append(skill_q)

        try:
            # 1. Search Projects across query dimensions
            if query_understanding.needs_projects:
                for q_term in search_queries[:2]:
                    proj_res = search_projects_tool(db, current_user, q_term, limit=candidate_pool_limit)
                    for item in proj_res.results:
                        pid_str = str(item.entity_id)
                        if pid_str not in seen_proj_ids:
                            seen_proj_ids.add(pid_str)
                            projects_list.append({
                                "id": pid_str,
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

            # 2. Search Research across query dimensions
            for q_term in search_queries[:2]:
                res_search = search_research_tool(db, current_user, q_term, limit=candidate_pool_limit)
                for item in res_search.results:
                    rid_str = str(item.entity_id)
                    if rid_str not in seen_res_ids:
                        seen_res_ids.add(rid_str)
                        research_list.append({
                            "id": rid_str,
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

            # 3. Search Problem / Solutions across query dimensions
            if query_understanding.needs_solutions:
                for q_term in search_queries[:2]:
                    sol_search = search_solutions_tool(db, current_user, q_term, limit=candidate_pool_limit)
                    for item in sol_search.results:
                        sid_str = str(item.entity_id)
                        if sid_str not in seen_sol_ids:
                            seen_sol_ids.add(sid_str)
                            solutions_list.append({
                                "id": sid_str,
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

            projects_list.sort(key=lambda x: float(x.get("score") or 0.0), reverse=True)
            research_list.sort(key=lambda x: float(x.get("score") or 0.0), reverse=True)
            solutions_list.sort(key=lambda x: float(x.get("score") or 0.0), reverse=True)

            return ProjectKnowledgeResult(
                projects=projects_list[:candidate_pool_limit],
                research=research_list[:candidate_pool_limit],
                solutions=solutions_list[:candidate_pool_limit],
                evidence=evidence_list,
                status="SUCCESS",
            )

        except Exception as exc:
            logger.error(f"Project & knowledge discovery agent error: {exc}")
            return ProjectKnowledgeResult(
                projects=[], research=[], solutions=[], evidence=[], status="FAILED"
            )
