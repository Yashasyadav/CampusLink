from typing import TypedDict, List, Dict, Any, Optional, Annotated
import operator


def reduce_list(left: Optional[List[Any]], right: Optional[List[Any]]) -> List[Any]:
    """State reducer for list fields, safely merging parallel node updates."""
    left = left or []
    right = right or []
    return left + right


def reduce_dict(left: Optional[Dict[str, Any]], right: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """State reducer for dictionary fields, safely merging key-value updates."""
    merged = dict(left or {})
    merged.update(right or {})
    return merged


class DiscoveryGraphState(TypedDict, total=False):
    """
    Strongly typed LangGraph state schema for CampusLink AI discovery workflow.
    STRICT SECURITY RULE: Never store raw passwords, tokens, API keys, or raw resume texts in state.
    """
    request_id: str
    user_id: str
    original_query: str
    
    # Query Understanding outputs
    query_understanding: Optional[Dict[str, Any]]
    required_skills: List[str]
    required_technologies: List[str]
    domain: List[str]
    needs_people: bool
    needs_projects: bool
    needs_solutions: bool
    needs_facilities: bool

    # Discovery branch outputs (Parallel Reducers)
    people_results: Annotated[List[Dict[str, Any]], reduce_list]
    project_results: Annotated[List[Dict[str, Any]], reduce_list]
    research_results: Annotated[List[Dict[str, Any]], reduce_list]
    solution_results: Annotated[List[Dict[str, Any]], reduce_list]
    facility_results: Annotated[List[Dict[str, Any]], reduce_list]
    equipment_results: Annotated[List[Dict[str, Any]], reduce_list]

    # Aggregated Evidence and Matching Results
    evidence: Annotated[List[Dict[str, Any]], reduce_list]
    top_people: Annotated[List[Dict[str, Any]], reduce_list]
    top_projects: Annotated[List[Dict[str, Any]], reduce_list]
    top_solutions: Annotated[List[Dict[str, Any]], reduce_list]
    top_research: Annotated[List[Dict[str, Any]], reduce_list]
    top_facilities: Annotated[List[Dict[str, Any]], reduce_list]
    help_chain: Optional[Dict[str, Any]]

    # Workflow Metadata & Observability
    agent_trace: Annotated[List[Dict[str, Any]], reduce_list]
    errors: Annotated[Dict[str, Any], reduce_dict]
    warnings: Annotated[List[str], reduce_list]
    status: str  # "RUNNING", "SUCCESS", "PARTIAL_SUCCESS", "FAILED", "VALIDATION_FAILED"
    started_at: str
    completed_at: Optional[str]
    current_stage: str
