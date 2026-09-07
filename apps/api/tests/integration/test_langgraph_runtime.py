import uuid
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.graph.builder import build_discovery_graph
from app.graph.execution import GraphExecutionService
from app.core.config import settings
from app.db.session import SyncSessionLocal
from app.models import User

client = TestClient(app)


@pytest.fixture
def auth_user_cookies():
    """Register and log in authenticated test user."""
    email = f"graph_test_{uuid.uuid4().hex[:8]}@campuslink.edu"
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!", "role": "STUDENT"},
    )
    assert reg.status_code == 201
    
    # Set profile as completed and searchable
    with SyncSessionLocal() as db:
        u = db.query(User).filter(User.email == email).first()
        if u and u.profile:
            u.profile.searchable = True
            u.profile.profile_completed = True
            db.commit()
            
    return reg.cookies


# ==============================================================================
# LANGGRAPH RUNTIME & ARCHITECTURAL VERIFICATION TESTS
# ==============================================================================

def test_1_graph_compilation():
    """Test 1: Verify state discovery graph compiles cleanly."""
    compiled_graph = build_discovery_graph()
    assert compiled_graph is not None
    assert hasattr(compiled_graph, "invoke")


def test_2_graph_structural_routing():
    """Test 2: Verify all 10 nodes are present in compiled LangGraph structure."""
    compiled_graph = build_discovery_graph()
    nodes = compiled_graph.nodes
    expected_nodes = [
        "initialize_request",
        "understand_query",
        "discover_people",
        "discover_knowledge",
        "discover_facilities",
        "aggregate_evidence",
        "rank_matches",
        "generate_explanations",
        "validate_results",
        "finalize_response",
    ]
    for node_name in expected_nodes:
        assert node_name in nodes, f"Expected graph node '{node_name}' missing from compiled graph."


def test_3_api_endpoint_invokes_graphexecutionservice(auth_user_cookies):
    """Test 3: Structural test proving POST /api/v1/agents/discover invokes GraphExecutionService and does not bypass it."""
    golden_query = "My ESP32 microphone is working, but my TinyML model is giving poor accuracy."
    
    with patch.object(GraphExecutionService, "run_workflow", wraps=GraphExecutionService().run_workflow) as spy_workflow:
        resp = client.post(
            "/api/v1/agents/discover",
            json={"query": golden_query},
            cookies=auth_user_cookies,
        )
        assert resp.status_code == 200
        assert spy_workflow.called, "API endpoint bypassed GraphExecutionService!"
        assert spy_workflow.call_count == 1
        call_kwargs = spy_workflow.call_args.kwargs
        assert call_kwargs["query"] == golden_query


def test_4_full_graph_execution_traces_and_nodes(auth_user_cookies):
    """Test 4-9: Execute POST /api/v1/agents/discover and verify 10-node execution trace metadata."""
    golden_query = "My ESP32 microphone is working, but my TinyML keyword detection model is giving poor accuracy."
    
    resp = client.post(
        "/api/v1/agents/discover",
        json={"query": golden_query},
        cookies=auth_user_cookies,
    )
    assert resp.status_code == 200
    data = resp.json()

    # Verify DiscoveryResponse top-level schema
    assert data["query"] == golden_query
    assert data["status"] in ("SUCCESS", "PARTIAL_SUCCESS")
    assert "query_understanding" in data
    assert "people" in data
    assert "projects" in data
    assert "facilities" in data

    # Verify agent traces executed all 10 graph stages
    traces = data.get("traces", [])
    executed_nodes = [t["agent_name"] for t in traces]
    
    expected_trace_nodes = [
        "InitializeRequestNode",
        "QueryUnderstandingAgent",
        "PeopleDiscoveryAgent",
        "ProjectKnowledgeDiscoveryAgent",
        "FacilityDiscoveryAgent",
        "EvidenceAggregatorNode",
        "MatchingEngineNode",
        "ExplanationEngineNode",
        "ValidationNode",
        "WorkflowFinalizerNode",
    ]
    for expected_node in expected_trace_nodes:
        assert expected_node in executed_nodes, f"Trace missing node execution entry for '{expected_node}'."


@pytest.mark.skipif(
    not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here",
    reason="Live Gemini API test requires configured GEMINI_API_KEY"
)
def test_live_api_langgraph_gemini_provider(auth_user_cookies, monkeypatch):
    """Test 4 (Live): Verifies real POST /api/v1/agents/discover -> LangGraph -> GeminiLLMProvider path."""
    monkeypatch.setattr(settings, "LLM_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-3.6-flash")

    golden_query = (
        "My ESP32 microphone is working, but my TinyML keyword detection model is giving poor accuracy. "
        "I don't know whether the problem is with the microphone, audio preprocessing, or the ML model."
    )
    
    resp = client.post(
        "/api/v1/agents/discover",
        json={"query": golden_query},
        cookies=auth_user_cookies,
    )
    assert resp.status_code == 200
    data = resp.json()

    traces = data.get("traces", [])
    qu_trace = next((t for t in traces if t["agent_name"] == "QueryUnderstandingAgent"), None)
    expl_trace = next((t for t in traces if t["agent_name"] == "ExplanationEngineNode"), None)

    assert qu_trace is not None
    assert qu_trace.get("provider") == "GeminiLLMProvider"
    assert qu_trace.get("model") == "gemini-3.6-flash"

    assert expl_trace is not None
    assert expl_trace.get("provider") == "GeminiLLMProvider"
    assert expl_trace.get("model") == "gemini-3.6-flash"

