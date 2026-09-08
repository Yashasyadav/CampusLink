import logging
import uuid
import time
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.users import User
from app.graph.builder import build_discovery_graph
from app.schemas.agents import (
    DiscoveryResponse,
    QueryUnderstandingResult,
    PeopleDiscoveryResult,
    ProjectKnowledgeResult,
    FacilityDiscoveryResult,
    Evidence,
    AgentTrace,
    PeopleCandidate,
)

logger = logging.getLogger(__name__)


class GraphExecutionService:
    """
    Central service for executing Phase 9 LangGraph agentic discovery workflows.
    Injects authenticated user context, manages execution lifecycle, formats agent traces,
    and returns backward-compatible DiscoveryResponse objects for the API and frontend.
    """

    def __init__(self):
        self.compiled_graph = build_discovery_graph()

    def run_workflow(self, db: Session, current_user: User, query: str) -> DiscoveryResponse:
        """
        Executes stateful LangGraph workflow for a natural language problem statement.
        """
        request_id = f"req_{uuid.uuid4().hex[:12]}"
        
        initial_state = {
            "request_id": request_id,
            "user_id": str(current_user.id),
            "original_query": query.strip(),
            "people_results": [],
            "project_results": [],
            "research_results": [],
            "solution_results": [],
            "facility_results": [],
            "equipment_results": [],
            "evidence": [],
            "top_people": [],
            "top_projects": [],
            "top_solutions": [],
            "top_research": [],
            "top_facilities": [],
            "agent_trace": [],
            "errors": {},
            "warnings": [],
            "status": "RUNNING",
        }

        config = {
            "configurable": {
                "db": db,
                "current_user": current_user,
                "request_id": request_id,
            },
            "max_concurrency": 1,
        }

        try:
            final_state = self.compiled_graph.invoke(initial_state, config=config)
            
            # Phase 10: Record RecommendationEvents for surfaced recommendations
            try:
                from app.services.recommendation_quality_service import RecommendationQualityService
                qs = RecommendationQualityService(db)
                qs.record_surfaced_recommendations_sync(
                    request_id=request_id,
                    user_id=current_user.id,
                    query=query,
                    top_people=final_state.get("top_people", []),
                    top_projects=final_state.get("top_projects", []),
                    top_solutions=final_state.get("solution_results", []),
                )
            except Exception as e_rec:
                logger.error(f"Failed to record recommendation events: {e_rec}")

            return self._format_discovery_response(final_state, query)
        except Exception as exc:
            logger.error(f"LangGraph execution exception: {exc}")
            # Fallback error response
            return DiscoveryResponse(
                query=query.strip(),
                query_understanding=QueryUnderstandingResult(
                    original_query=query,
                    domain=[],
                    skills=[],
                    technologies=[],
                    problem_keywords=[],
                ),
                people=PeopleDiscoveryResult(candidates=[], status="FAILED", summary=str(exc)),
                projects=ProjectKnowledgeResult(projects=[], research=[], solutions=[], evidence=[], status="FAILED"),
                facilities=FacilityDiscoveryResult(facilities=[], equipment=[], evidence=[], status="FAILED"),
                evidence=[],
                status="FAILED",
                traces=[
                    AgentTrace(
                        agent_name="GraphExecutionService",
                        started_at="",
                        completed_at="",
                        tools_called=[],
                        result_count=0,
                        status="FAILED",
                        duration_ms=0.0,
                    )
                ],
            )

    def _format_discovery_response(self, state: Dict[str, Any], original_query: str) -> DiscoveryResponse:
        """Converts graph final state dictionary into DiscoveryResponse."""
        qu_dict = state.get("query_understanding") or {}
        qu_result = (
            QueryUnderstandingResult.model_validate(qu_dict)
            if qu_dict
            else QueryUnderstandingResult(
                original_query=original_query,
                domain=[],
                skills=[],
                technologies=[],
                problem_keywords=[],
            )
        )

        # Reconstruct people candidates
        people_cands = []
        for p in state.get("people_results", []):
            try:
                people_cands.append(PeopleCandidate.model_validate(p))
            except Exception:
                pass

        people_res = PeopleDiscoveryResult(
            candidates=people_cands,
            status="SUCCESS" if people_cands else "EMPTY",
            summary=f"Discovered {len(people_cands)} campus people candidates.",
        )

        project_res = ProjectKnowledgeResult(
            projects=state.get("project_results", []),
            research=state.get("research_results", []),
            solutions=state.get("solution_results", []),
            evidence=[],
            status="SUCCESS",
        )

        facility_res = FacilityDiscoveryResult(
            facilities=state.get("facility_results", []),
            equipment=state.get("equipment_results", []),
            evidence=[],
            status="SUCCESS",
        )

        evidence_list = []
        for ev in state.get("evidence", []):
            try:
                evidence_list.append(Evidence.model_validate(ev))
            except Exception:
                pass

        traces_list = []
        for tr in state.get("agent_trace", []):
            try:
                traces_list.append(AgentTrace.model_validate(tr))
            except Exception:
                pass

        from app.services.matching_service import determine_result_composition
        result_comp = determine_result_composition(qu_result.intent)

        return DiscoveryResponse(
            query=original_query.strip(),
            query_understanding=qu_result,
            people=people_res,
            projects=project_res,
            facilities=facility_res,
            evidence=evidence_list,
            status=state.get("status", "SUCCESS"),
            traces=traces_list,
            result_composition=result_comp,
        )
