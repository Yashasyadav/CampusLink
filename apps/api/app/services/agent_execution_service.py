import time
import logging
from datetime import datetime, timezone
from typing import List, Any
from app.models.users import User

from app.schemas.agents import (
    DiscoveryResponse,
    QueryUnderstandingResult,
    PeopleDiscoveryResult,
    ProjectKnowledgeResult,
    FacilityDiscoveryResult,
    Evidence,
    AgentTrace,
)

from app.agents.query_understanding import QueryUnderstandingAgent
from app.agents.people_discovery import PeopleDiscoveryAgent
from app.agents.project_knowledge import ProjectKnowledgeDiscoveryAgent
from app.agents.facility_discovery import FacilityDiscoveryAgent

logger = logging.getLogger(__name__)


class AgentExecutionService:
    """Central orchestrator for Phase 7 agentic campus discovery workflows."""

    def __init__(self):
        self.query_agent = QueryUnderstandingAgent()
        self.people_agent = PeopleDiscoveryAgent()
        self.project_agent = ProjectKnowledgeDiscoveryAgent()
        self.facility_agent = FacilityDiscoveryAgent()

    def discover(self, db: Any, current_user: User, query: str) -> DiscoveryResponse:
        """
        Execute deterministic discovery workflow:
        1. Query Understanding
        2. People Discovery (if needed)
        3. Project/Knowledge Discovery (if needed)
        4. Facility Discovery (if needed)
        5. Aggregate evidence and traces
        """
        traces: List[AgentTrace] = []
        all_evidence: List[Evidence] = []
        overall_status = "SUCCESS"

        # Step 1: Query Understanding
        t0 = time.time()
        start_iso = datetime.now(timezone.utc).isoformat()
        qu_res = self.query_agent.analyze(query)
        t_duration = round((time.time() - t0) * 1000, 2)
        end_iso = datetime.now(timezone.utc).isoformat()

        traces.append(AgentTrace(
            agent_name="QueryUnderstandingAgent",
            started_at=start_iso,
            completed_at=end_iso,
            tools_called=[],
            result_count=len(qu_res.skills) + len(qu_res.technologies),
            status="SUCCESS",
            duration_ms=t_duration,
        ))

        # Step 2: People Discovery
        people_res = PeopleDiscoveryResult(candidates=[], status="SKIPPED", summary="Not requested.")
        if qu_res.needs_people:
            t0 = time.time()
            start_iso = datetime.now(timezone.utc).isoformat()
            try:
                people_res = self.people_agent.discover(db, current_user, qu_res, limit=5)
                for cand in people_res.candidates:
                    all_evidence.extend(cand.evidence)
            except Exception as exc:
                logger.error(f"People agent failure: {exc}")
                people_res = PeopleDiscoveryResult(candidates=[], status="FAILED", summary=str(exc))
                overall_status = "PARTIAL_SUCCESS"

            t_duration = round((time.time() - t0) * 1000, 2)
            end_iso = datetime.now(timezone.utc).isoformat()
            traces.append(AgentTrace(
                agent_name="PeopleDiscoveryAgent",
                started_at=start_iso,
                completed_at=end_iso,
                tools_called=["search_people_tool", "get_profile_tool"],
                result_count=len(people_res.candidates),
                status=people_res.status,
                duration_ms=t_duration,
            ))

        # Step 3: Project & Knowledge Discovery
        project_res = ProjectKnowledgeResult(projects=[], research=[], solutions=[], evidence=[], status="SKIPPED")
        if qu_res.needs_projects or qu_res.needs_solutions:
            t0 = time.time()
            start_iso = datetime.now(timezone.utc).isoformat()
            try:
                project_res = self.project_agent.discover(db, current_user, qu_res, limit=5)
                all_evidence.extend(project_res.evidence)
            except Exception as exc:
                logger.error(f"Project agent failure: {exc}")
                project_res = ProjectKnowledgeResult(projects=[], research=[], solutions=[], evidence=[], status="FAILED")
                overall_status = "PARTIAL_SUCCESS"

            t_duration = round((time.time() - t0) * 1000, 2)
            end_iso = datetime.now(timezone.utc).isoformat()
            traces.append(AgentTrace(
                agent_name="ProjectKnowledgeDiscoveryAgent",
                started_at=start_iso,
                completed_at=end_iso,
                tools_called=["search_projects_tool", "search_research_tool", "search_solutions_tool"],
                result_count=len(project_res.projects) + len(project_res.research) + len(project_res.solutions),
                status=project_res.status,
                duration_ms=t_duration,
            ))

        # Step 4: Facility & Equipment Discovery
        facility_res = FacilityDiscoveryResult(facilities=[], equipment=[], evidence=[], status="SKIPPED")
        if qu_res.needs_facilities:
            t0 = time.time()
            start_iso = datetime.now(timezone.utc).isoformat()
            try:
                facility_res = self.facility_agent.discover(db, current_user, qu_res, limit=5)
                all_evidence.extend(facility_res.evidence)
            except Exception as exc:
                logger.error(f"Facility agent failure: {exc}")
                facility_res = FacilityDiscoveryResult(facilities=[], equipment=[], evidence=[], status="FAILED")
                overall_status = "PARTIAL_SUCCESS"

            t_duration = round((time.time() - t0) * 1000, 2)
            end_iso = datetime.now(timezone.utc).isoformat()
            traces.append(AgentTrace(
                agent_name="FacilityDiscoveryAgent",
                started_at=start_iso,
                completed_at=end_iso,
                tools_called=["search_facilities_tool", "search_equipment_tool"],
                result_count=len(facility_res.facilities) + len(facility_res.equipment),
                status=facility_res.status,
                duration_ms=t_duration,
            ))

        # Deduplicate aggregated evidence pointers
        unique_evidence: List[Evidence] = []
        seen_keys = set()
        for ev in all_evidence:
            key = (ev.entity_type, ev.entity_id)
            if key not in seen_keys:
                seen_keys.add(key)
                unique_evidence.append(ev)

        return DiscoveryResponse(
            query=query.strip(),
            query_understanding=qu_res,
            people=people_res,
            projects=project_res,
            facilities=facility_res,
            evidence=unique_evidence,
            status=overall_status,
            traces=traces,
        )
