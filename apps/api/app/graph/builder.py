import logging
from langgraph.graph import StateGraph, START, END
from app.graph.state import DiscoveryGraphState
from app.graph.nodes import (
    node_initialize_request,
    node_understand_query,
    node_discover_people,
    node_discover_knowledge,
    node_discover_facilities,
    node_aggregate_evidence,
    node_rank_matches,
    node_generate_explanations,
    node_validate_results,
    node_finalize_response,
)
from app.graph.routing import route_after_query_understanding

logger = logging.getLogger(__name__)


def build_discovery_graph():
    """
    Constructs and compiles the Phase 9 LangGraph stateful discovery & matching workflow.
    """
    builder = StateGraph(DiscoveryGraphState)

    # 1. Register 10 Graph Nodes
    builder.add_node("initialize_request", node_initialize_request)
    builder.add_node("understand_query", node_understand_query)
    builder.add_node("discover_people", node_discover_people)
    builder.add_node("discover_knowledge", node_discover_knowledge)
    builder.add_node("discover_facilities", node_discover_facilities)
    builder.add_node("aggregate_evidence", node_aggregate_evidence)
    builder.add_node("rank_matches", node_rank_matches)
    builder.add_node("generate_explanations", node_generate_explanations)
    builder.add_node("validate_results", node_validate_results)
    builder.add_node("finalize_response", node_finalize_response)

    # 2. Register Start Edges
    builder.add_edge(START, "initialize_request")
    builder.add_edge("initialize_request", "understand_query")

    # 3. Discovery Pipeline Edges (Sequential execution preserves SQLAlchemy greenlet thread safety)
    builder.add_edge("understand_query", "discover_people")
    builder.add_edge("discover_people", "discover_knowledge")
    builder.add_edge("discover_knowledge", "discover_facilities")
    builder.add_edge("discover_facilities", "aggregate_evidence")

    # 5. Sequential Downstream Pipeline
    builder.add_edge("aggregate_evidence", "rank_matches")
    builder.add_edge("rank_matches", "generate_explanations")
    builder.add_edge("generate_explanations", "validate_results")
    builder.add_edge("validate_results", "finalize_response")
    builder.add_edge("finalize_response", END)

    compiled_graph = builder.compile()
    logger.info("Compiled Phase 9 LangGraph Discovery StateGraph successfully.")
    return compiled_graph
