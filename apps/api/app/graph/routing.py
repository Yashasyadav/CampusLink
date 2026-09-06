import logging
from typing import List
from app.graph.state import DiscoveryGraphState

logger = logging.getLogger(__name__)


def route_after_query_understanding(state: DiscoveryGraphState) -> List[str]:
    """
    Dynamic conditional routing after query understanding.
    Determines which discovery branches fan out in parallel.
    """
    branches: List[str] = []

    if state.get("needs_people", True):
        branches.append("discover_people")
    if state.get("needs_projects", True) or state.get("needs_solutions", True):
        branches.append("discover_knowledge")
    if state.get("needs_facilities", False):
        branches.append("discover_facilities")

    if not branches:
        branches = ["discover_people", "discover_knowledge"]

    logger.info(f"Dynamic graph routing branches: {branches}")
    return branches


def route_after_discovery(state: DiscoveryGraphState) -> str:
    """Joins parallel discovery branch outputs into evidence aggregation."""
    return "aggregate_evidence"


def route_after_validation(state: DiscoveryGraphState) -> str:
    """Routes to finalization node."""
    return "finalize_response"
