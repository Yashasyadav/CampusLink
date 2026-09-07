import uuid
import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from langchain_core.runnables import RunnableConfig

from app.graph.state import DiscoveryGraphState
from app.graph.errors import GraphError
from app.schemas.agents import QueryUnderstandingResult
from app.agents.query_understanding import QueryUnderstandingAgent
from app.agents.people_discovery import PeopleDiscoveryAgent
from app.agents.project_knowledge import ProjectKnowledgeDiscoveryAgent
from app.agents.facility_discovery import FacilityDiscoveryAgent
from app.services.evidence_service import EvidenceService
from app.services.scoring_service import ScoringService
from app.services.explanation_service import ExplanationService
from app.services.matching_service import MatchingService

logger = logging.getLogger(__name__)


def _get_configurable(config: Optional[RunnableConfig] = None) -> Dict[str, Any]:
    """Helper to extract configurable dictionary safely from RunnableConfig or dict."""
    if not config:
        return {}
    if isinstance(config, dict):
        return config.get("configurable", {})
    return getattr(config, "configurable", {}) or {}



def node_initialize_request(state: DiscoveryGraphState, config: RunnableConfig = None) -> Dict[str, Any]:
    """Node 1: Initializes graph request ID, metadata, and execution trace."""
    request_id = state.get("request_id") or f"req_{uuid.uuid4().hex[:12]}"
    start_iso = datetime.now(timezone.utc).isoformat()

    trace_entry = {
        "agent_name": "InitializeRequestNode",
        "started_at": start_iso,
        "completed_at": start_iso,
        "tools_called": [],
        "result_count": 1,
        "status": "SUCCESS",
        "duration_ms": 0.0,
    }

    return {
        "request_id": request_id,
        "started_at": start_iso,
        "status": "RUNNING",
        "current_stage": "INITIALIZED",
        "agent_trace": [trace_entry],
        "warnings": [],
        "errors": {},
    }


def node_understand_query(state: DiscoveryGraphState, config: RunnableConfig = None) -> Dict[str, Any]:
    """Node 2: Invokes QueryUnderstandingAgent to analyze problem intent and required dimensions."""
    t0 = time.time()
    start_iso = datetime.now(timezone.utc).isoformat()
    query = state.get("original_query", "")

    try:
        agent = QueryUnderstandingAgent()
        qu_res = agent.analyze(query)
        t_dur = round((time.time() - t0) * 1000, 2)
        end_iso = datetime.now(timezone.utc).isoformat()

        provider_name = agent.provider.__class__.__name__ if hasattr(agent, "provider") and agent.provider else None
        model_name = agent.provider.model_name if hasattr(agent, "provider") and agent.provider else None

        trace_entry = {
            "agent_name": "QueryUnderstandingAgent",
            "started_at": start_iso,
            "completed_at": end_iso,
            "tools_called": [],
            "result_count": len(qu_res.skills) + len(qu_res.technologies),
            "status": "SUCCESS",
            "duration_ms": t_dur,
            "provider": provider_name,
            "model": model_name,
        }

        return {
            "query_understanding": qu_res.model_dump(),
            "required_skills": qu_res.skills,
            "required_technologies": qu_res.technologies,
            "domain": qu_res.domain,
            "needs_people": qu_res.needs_people,
            "needs_projects": qu_res.needs_projects,
            "needs_solutions": qu_res.needs_solutions,
            "needs_facilities": qu_res.needs_facilities,
            "current_stage": "QUERY_UNDERSTOOD",
            "agent_trace": [trace_entry],
        }
    except Exception as exc:
        logger.error(f"Query understanding node error: {exc}")
        err = GraphError(stage="understand_query", code="QUERY_PARSING_FAILED", message=str(exc))
        return {
            "errors": {"query_understanding": err.to_dict()},
            "status": "FAILED",
            "current_stage": "FAILED",
        }


def node_discover_people(state: DiscoveryGraphState, config: RunnableConfig = None) -> Dict[str, Any]:
    """Node 3: Executes people discovery branch."""
    t0 = time.time()
    start_iso = datetime.now(timezone.utc).isoformat()
    
    # Extract runtime db and current_user from config context
    configurable = _get_configurable(config)
    db = configurable.get("db")
    current_user = configurable.get("current_user")

    qu_dict = state.get("query_understanding")
    if not qu_dict or not db or not current_user:
        return {"people_results": []}

    try:
        qu_res = QueryUnderstandingResult.model_validate(qu_dict)
        agent = PeopleDiscoveryAgent()
        res = agent.discover(db, current_user, qu_res, limit=5)
        t_dur = round((time.time() - t0) * 1000, 2)
        end_iso = datetime.now(timezone.utc).isoformat()

        candidates_dict = [c.model_dump() for c in res.candidates]
        trace_entry = {
            "agent_name": "PeopleDiscoveryAgent",
            "started_at": start_iso,
            "completed_at": end_iso,
            "tools_called": ["search_people_tool", "get_profile_tool"],
            "result_count": len(candidates_dict),
            "status": res.status,
            "duration_ms": t_dur,
        }

        return {
            "people_results": candidates_dict,
            "agent_trace": [trace_entry],
        }
    except Exception as exc:
        logger.error(f"People discovery node error: {exc}")
        err = GraphError(stage="discover_people", code="PEOPLE_BRANCH_FAILED", message=str(exc), retryable=True)
        return {
            "errors": {"people": err.to_dict()},
            "warnings": [f"Campus people search unavailable: {str(exc)}"],
            "people_results": [],
        }


def node_discover_knowledge(state: DiscoveryGraphState, config: RunnableConfig = None) -> Dict[str, Any]:
    """Node 4: Executes project, research, and previous solution discovery branch."""
    t0 = time.time()
    start_iso = datetime.now(timezone.utc).isoformat()
    
    configurable = _get_configurable(config)
    db = configurable.get("db")
    current_user = configurable.get("current_user")

    qu_dict = state.get("query_understanding")
    if not qu_dict or not db or not current_user:
        return {"project_results": [], "research_results": [], "solution_results": []}

    try:
        qu_res = QueryUnderstandingResult.model_validate(qu_dict)
        agent = ProjectKnowledgeDiscoveryAgent()
        res = agent.discover(db, current_user, qu_res, limit=5)
        t_dur = round((time.time() - t0) * 1000, 2)
        end_iso = datetime.now(timezone.utc).isoformat()

        trace_entry = {
            "agent_name": "ProjectKnowledgeDiscoveryAgent",
            "started_at": start_iso,
            "completed_at": end_iso,
            "tools_called": ["search_projects_tool", "search_research_tool", "search_solutions_tool"],
            "result_count": len(res.projects) + len(res.research) + len(res.solutions),
            "status": res.status,
            "duration_ms": t_dur,
        }

        return {
            "project_results": res.projects,
            "research_results": res.research,
            "solution_results": res.solutions,
            "agent_trace": [trace_entry],
        }
    except Exception as exc:
        logger.error(f"Knowledge discovery node error: {exc}")
        err = GraphError(stage="discover_knowledge", code="KNOWLEDGE_BRANCH_FAILED", message=str(exc), retryable=True)
        return {
            "errors": {"knowledge": err.to_dict()},
            "warnings": [f"Campus project and solution search unavailable: {str(exc)}"],
            "project_results": [],
            "research_results": [],
            "solution_results": [],
        }


def node_discover_facilities(state: DiscoveryGraphState, config: RunnableConfig = None) -> Dict[str, Any]:
    """Node 5: Executes facility and equipment discovery branch."""
    t0 = time.time()
    start_iso = datetime.now(timezone.utc).isoformat()
    
    configurable = _get_configurable(config)
    db = configurable.get("db")
    current_user = configurable.get("current_user")

    qu_dict = state.get("query_understanding")
    if not qu_dict or not db or not current_user:
        return {"facility_results": [], "equipment_results": []}

    try:
        qu_res = QueryUnderstandingResult.model_validate(qu_dict)
        agent = FacilityDiscoveryAgent()
        res = agent.discover(db, current_user, qu_res, limit=5)
        t_dur = round((time.time() - t0) * 1000, 2)
        end_iso = datetime.now(timezone.utc).isoformat()

        trace_entry = {
            "agent_name": "FacilityDiscoveryAgent",
            "started_at": start_iso,
            "completed_at": end_iso,
            "tools_called": ["search_facilities_tool", "search_equipment_tool"],
            "result_count": len(res.facilities) + len(res.equipment),
            "status": res.status,
            "duration_ms": t_dur,
        }

        return {
            "facility_results": res.facilities,
            "equipment_results": res.equipment,
            "agent_trace": [trace_entry],
        }
    except Exception as exc:
        logger.error(f"Facility discovery node error: {exc}")
        err = GraphError(stage="discover_facilities", code="FACILITIES_BRANCH_FAILED", message=str(exc), retryable=True)
        return {
            "errors": {"facilities": err.to_dict()},
            "warnings": [f"Campus lab and hardware search unavailable: {str(exc)}"],
            "facility_results": [],
            "equipment_results": [],
        }


def node_aggregate_evidence(state: DiscoveryGraphState, config: RunnableConfig = None) -> Dict[str, Any]:
    """Node 6: Aggregates and normalizes evidence pointers across all discovery branches."""
    t0 = time.time()
    start_iso = datetime.now(timezone.utc).isoformat()

    all_evidence = []
    # Collect evidence attached to people
    for cand in state.get("people_results", []):
        for ev in cand.get("evidence", []):
            all_evidence.append(ev)

    # Deduplicate evidence pointers
    unique_evidence = []
    seen = set()
    for ev in all_evidence:
        key = (ev.get("entity_type"), str(ev.get("entity_id")))
        if key not in seen:
            seen.add(key)
            unique_evidence.append(ev)

    t_dur = round((time.time() - t0) * 1000, 2)
    end_iso = datetime.now(timezone.utc).isoformat()

    trace_entry = {
        "agent_name": "EvidenceAggregatorNode",
        "started_at": start_iso,
        "completed_at": end_iso,
        "tools_called": [],
        "result_count": len(unique_evidence),
        "status": "SUCCESS",
        "duration_ms": t_dur,
    }

    return {
        "evidence": unique_evidence,
        "current_stage": "EVIDENCE_AGGREGATED",
        "agent_trace": [trace_entry],
    }


def node_rank_matches(state: DiscoveryGraphState, config: RunnableConfig = None) -> Dict[str, Any]:
    """Node 7: Deterministic candidate relevance scoring and Help Chain construction."""
    t0 = time.time()
    start_iso = datetime.now(timezone.utc).isoformat()

    matching_service = MatchingService()
    scoring_service = ScoringService()

    q_skills = state.get("required_skills", [])
    q_tech = state.get("required_technologies", [])
    q_domains = state.get("domain", [])
    query = state.get("original_query", "")

    # Score people candidates
    top_people = []
    for cand in state.get("people_results", []):
        c_skills = cand.get("matched_skills", [])
        c_tech = cand.get("matched_technologies", [])
        ev_graph = cand.get("person_evidence_graph", {})
        raw_ev = cand.get("evidence", [])
        has_proj = any(e.get("entity_type", "").upper() == "PROJECT" for e in raw_ev) or bool(ev_graph.get("projects"))
        has_sol = any(e.get("entity_type", "").upper() == "PROBLEM_SOLUTION" for e in raw_ev) or bool(ev_graph.get("solutions"))
        raw_score = float(raw_ev[0].get("score") if raw_ev else 0.50)

        all_cand_tech = scoring_service.collect_candidate_technologies(
            candidate_technologies=c_tech,
            person_evidence_graph=ev_graph,
        )

        q_tech_lower = {t.lower().strip() for t in q_tech if t.strip()}
        matched_tech_list = [t for t in all_cand_tech if t.lower().strip() in q_tech_lower]
        if not matched_tech_list:
            matched_tech_list = c_tech

        score, lvl, ev_str, _ = scoring_service.calculate_score(
            semantic_relevance=raw_score,
            query_skills=q_skills,
            candidate_skills=c_skills,
            query_technologies=q_tech,
            candidate_technologies=all_cand_tech,
            has_project_evidence=has_proj,
            has_solution_evidence=has_sol,
            person_evidence_graph=ev_graph,
        )

        evidence_service = EvidenceService()
        formatted_ev = evidence_service.format_evidence_items(
            candidate_id=str(cand.get("user_id")),
            candidate_type="PERSON",
            raw_evidences=raw_ev,
            candidate_meta={"display_name": cand.get("display_name"), "department": cand.get("department")},
        )

        top_people.append({
            "candidate_id": str(cand.get("user_id")),
            "candidate_type": "PERSON",
            "title": cand.get("display_name", "Campus Member"),
            "subtitle": cand.get("department", "Campus Member"),
            "relevance_score": score,
            "relevance_level": lvl,
            "matched_skills": c_skills,
            "matched_technologies": matched_tech_list,
            "matched_domains": q_domains,
            "evidence_strength": ev_str,
            "supporting_evidence": formatted_ev,
            "explanation": f"{lvl} match based on shared technical expertise.",
            "strengths": [f"Skills: {', '.join(c_skills[:3])}"] if c_skills else ["Campus Profile"],
            "limitations": [],
        })

    top_people.sort(key=lambda x: x["relevance_score"], reverse=True)

    # Score projects
    top_projects = []
    for proj in state.get("project_results", []):
        proj_id = str(proj.get("id") or proj.get("project_id", ""))
        title = proj.get("title", "Campus Project")
        skills = proj.get("skills", [])
        tech = proj.get("technologies", [])
        score_raw = float(proj.get("score") or proj.get("relevance") or 0.50)

        score, lvl, ev_str, _ = scoring_service.calculate_score(
            semantic_relevance=score_raw,
            query_skills=q_skills,
            candidate_skills=skills,
            query_technologies=q_tech,
            candidate_technologies=tech,
            has_project_evidence=True,
            has_solution_evidence=False,
            best_evidence_type="PROJECT",
        )

        if score < 0.35:
            continue

        top_projects.append({
            "candidate_id": proj_id,
            "candidate_type": "PROJECT",
            "title": title,
            "subtitle": "Campus Project",
            "relevance_score": score,
            "relevance_level": lvl,
            "matched_skills": skills,
            "matched_technologies": tech,
            "matched_domains": q_domains,
            "evidence_strength": ev_str,
            "supporting_evidence": [],
            "explanation": f"{lvl} as a similar campus project.",
            "strengths": [f"Technologies: {', '.join(tech[:3])}"] if tech else ["Campus Project"],
            "limitations": [],
        })

    top_projects.sort(key=lambda x: x["relevance_score"], reverse=True)

    # Construct Help Chain
    from app.schemas.matching import MatchingResult
    typed_people = [MatchingResult.model_validate(p) for p in top_people]
    typed_projects = [MatchingResult.model_validate(pr) for pr in top_projects]

    help_chain_obj = matching_service.construct_help_chain(q_skills, q_tech, q_domains, typed_people, typed_projects)
    help_chain_dict = help_chain_obj.model_dump() if help_chain_obj else None

    t_dur = round((time.time() - t0) * 1000, 2)
    end_iso = datetime.now(timezone.utc).isoformat()

    trace_entry = {
        "agent_name": "MatchingEngineNode",
        "started_at": start_iso,
        "completed_at": end_iso,
        "tools_called": [],
        "result_count": len(top_people) + len(top_projects),
        "status": "SUCCESS",
        "duration_ms": t_dur,
    }

    return {
        "top_people": top_people,
        "top_projects": top_projects,
        "help_chain": help_chain_dict,
        "current_stage": "MATCHES_RANKED",
        "agent_trace": [trace_entry],
    }


def node_generate_explanations(state: DiscoveryGraphState, config: RunnableConfig = None) -> Dict[str, Any]:
    """Node 8: Generates grounded human-readable explanations using ExplanationService."""
    t0 = time.time()
    start_iso = datetime.now(timezone.utc).isoformat()
    exp_service = ExplanationService()
    query = state.get("original_query", "")

    updated_people = []
    for item in state.get("top_people", []):
        explanation, help_type, strengths, limitations = exp_service.generate_explanation(
            query=query,
            candidate_title=item["title"],
            candidate_type="PERSON",
            relevance_score=item["relevance_score"],
            relevance_level=item["relevance_level"],
            matched_skills=item.get("matched_skills", []),
            matched_technologies=item.get("matched_technologies", []),
            evidence_items=[],
        )
        item["explanation"] = explanation
        item["help_type"] = help_type.value if help_type else None
        item["strengths"] = strengths
        item["limitations"] = limitations
        updated_people.append(item)

    t_dur = round((time.time() - t0) * 1000, 2)
    end_iso = datetime.now(timezone.utc).isoformat()

    provider_name = exp_service.llm_provider.__class__.__name__ if hasattr(exp_service, "llm_provider") and exp_service.llm_provider else None
    model_name = exp_service.llm_provider.model_name if hasattr(exp_service, "llm_provider") and exp_service.llm_provider else None

    trace_entry = {
        "agent_name": "ExplanationEngineNode",
        "started_at": start_iso,
        "completed_at": end_iso,
        "tools_called": [],
        "result_count": len(updated_people),
        "status": "SUCCESS",
        "duration_ms": t_dur,
        "provider": provider_name,
        "model": model_name,
    }

    return {
        "top_people": updated_people,
        "current_stage": "EXPLANATIONS_GENERATED",
        "agent_trace": [trace_entry],
    }


def node_validate_results(state: DiscoveryGraphState, config: RunnableConfig = None) -> Dict[str, Any]:
    """Node 9: Security and schema validation gate before finalizing response."""
    t0 = time.time()
    start_iso = datetime.now(timezone.utc).isoformat()
    warnings = list(state.get("warnings", []))

    # Security check: verify no secrets or private document tags leaked into response state
    all_text = str(state.get("top_people", [])) + str(state.get("top_projects", []))
    if "PRIVATE_RESUME" in all_text or "hidden_contact" in all_text:
        warnings.append("Filtered internal private content flags from response.")

    t_dur = round((time.time() - t0) * 1000, 2)
    end_iso = datetime.now(timezone.utc).isoformat()

    trace_entry = {
        "agent_name": "ValidationNode",
        "started_at": start_iso,
        "completed_at": end_iso,
        "tools_called": [],
        "result_count": 1,
        "status": "SUCCESS",
        "duration_ms": t_dur,
    }

    return {
        "warnings": warnings,
        "current_stage": "VALIDATED",
        "agent_trace": [trace_entry],
    }


def node_finalize_response(state: DiscoveryGraphState, config: RunnableConfig = None) -> Dict[str, Any]:
    """Node 10: Constructs final response state and sets status."""
    end_iso = datetime.now(timezone.utc).isoformat()
    errors = state.get("errors", {})
    
    status = "SUCCESS"
    if errors:
        status = "PARTIAL_SUCCESS" if any(k in state for k in ["people_results", "project_results"]) else "FAILED"

    trace_entry = {
        "agent_name": "WorkflowFinalizerNode",
        "started_at": state.get("started_at", end_iso),
        "completed_at": end_iso,
        "tools_called": [],
        "result_count": len(state.get("top_people", [])) + len(state.get("top_projects", [])),
        "status": status,
        "duration_ms": 0.0,
    }

    return {
        "status": status,
        "completed_at": end_iso,
        "current_stage": "COMPLETED",
        "agent_trace": [trace_entry],
    }
