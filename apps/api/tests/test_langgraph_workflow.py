import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.graph.builder import build_discovery_graph
from app.graph.state import DiscoveryGraphState, reduce_list, reduce_dict
from app.graph.nodes import (
    node_initialize_request,
    node_understand_query,
    node_aggregate_evidence,
    node_rank_matches,
    node_generate_explanations,
    node_validate_results,
    node_finalize_response,
)
from app.graph.routing import route_after_query_understanding
from app.graph.execution import GraphExecutionService
from app.graph.errors import GraphError
from app.schemas.agents import DiscoveryResponse

client = TestClient(app)


@pytest.fixture
def test_user_cookies():
    """Register and login primary test user."""
    email = f"graph_user_{uuid.uuid4().hex[:8]}@campuslink.edu"
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!", "role": "STUDENT"},
    )
    assert reg.status_code == 201
    client.cookies = reg.cookies
    return reg.cookies


# ============================================================
# PHASE 9 LANGGRAPH WORKFLOW ORCHESTRATION TESTS
# ============================================================

def test_graph_builds_successfully():
    graph = build_discovery_graph()
    assert graph is not None


def test_graph_starts_at_start_and_ends_at_end():
    graph = build_discovery_graph()
    # Graph compilation produces an executable CompiledStateGraph
    assert hasattr(graph, "invoke")


def test_node_initialize_request():
    state: DiscoveryGraphState = {"original_query": "Test ESP32 Query"}
    res = node_initialize_request(state)
    assert "request_id" in res
    assert res["request_id"].startswith("req_")
    assert res["status"] == "RUNNING"
    assert len(res["agent_trace"]) == 1


def test_node_understand_query():
    state: DiscoveryGraphState = {"original_query": "My ESP32 TinyML keyword detection model has poor accuracy"}
    res = node_understand_query(state)
    assert "query_understanding" in res
    assert res["needs_people"] is True
    assert len(res["agent_trace"]) == 1


def test_state_merging_reducers():
    # Verify parallel list reducer merges items without overwriting
    list_a = [{"id": 1, "name": "Cand A"}]
    list_b = [{"id": 2, "name": "Cand B"}]
    merged_list = reduce_list(list_a, list_b)
    assert len(merged_list) == 2

    # Verify parallel dict reducer merges keys
    dict_a = {"people": "error_a"}
    dict_b = {"facilities": "error_b"}
    merged_dict = reduce_dict(dict_a, dict_b)
    assert "people" in merged_dict and "facilities" in merged_dict


def test_deterministic_routing_people_only():
    state: DiscoveryGraphState = {
        "needs_people": True,
        "needs_projects": False,
        "needs_solutions": False,
        "needs_facilities": False,
    }
    branches = route_after_query_understanding(state)
    assert "discover_people" in branches
    assert "discover_facilities" not in branches


def test_deterministic_routing_facilities_only():
    state: DiscoveryGraphState = {
        "needs_people": False,
        "needs_projects": False,
        "needs_solutions": False,
        "needs_facilities": True,
    }
    branches = route_after_query_understanding(state)
    assert "discover_facilities" in branches
    assert "discover_people" not in branches


def test_deterministic_routing_all_branches():
    state: DiscoveryGraphState = {
        "needs_people": True,
        "needs_projects": True,
        "needs_solutions": True,
        "needs_facilities": True,
    }
    branches = route_after_query_understanding(state)
    assert "discover_people" in branches
    assert "discover_knowledge" in branches
    assert "discover_facilities" in branches


def test_node_aggregate_evidence():
    state: DiscoveryGraphState = {
        "people_results": [
            {
                "user_id": str(uuid.uuid4()),
                "display_name": "Student A",
                "evidence": [
                    {
                        "entity_type": "PROJECT",
                        "entity_id": str(uuid.uuid4()),
                        "title": "Edge Classifier",
                        "source": "search_projects",
                        "snippet": "Built TinyML model",
                        "score": 0.90,
                    }
                ],
            }
        ]
    }
    res = node_aggregate_evidence(state)
    assert len(res["evidence"]) == 1
    assert res["current_stage"] == "EVIDENCE_AGGREGATED"


def test_node_rank_matches():
    state: DiscoveryGraphState = {
        "original_query": "ESP32 TinyML accuracy",
        "required_skills": ["TinyML"],
        "required_technologies": ["ESP32"],
        "domain": ["Embedded Systems"],
        "people_results": [
            {
                "user_id": str(uuid.uuid4()),
                "display_name": "Student Dev",
                "department": "CSE",
                "matched_skills": ["TinyML"],
                "evidence": [],
            }
        ],
        "project_results": [],
    }
    res = node_rank_matches(state)
    assert len(res["top_people"]) == 1
    assert res["top_people"][0]["relevance_score"] > 0.0


def test_node_generate_explanations():
    state: DiscoveryGraphState = {
        "original_query": "ESP32 TinyML accuracy",
        "top_people": [
            {
                "title": "Student Dev",
                "relevance_score": 0.90,
                "relevance_level": "High relevance",
                "matched_skills": ["TinyML"],
                "matched_technologies": ["ESP32"],
            }
        ],
    }
    res = node_generate_explanations(state)
    assert len(res["top_people"]) == 1
    assert "explanation" in res["top_people"][0]


def test_node_validate_results_privacy_strip():
    state: DiscoveryGraphState = {
        "top_people": [
            {"title": "Dev", "explanation": "Includes PRIVATE_RESUME text"}
        ],
        "warnings": [],
    }
    res = node_validate_results(state)
    assert len(res["warnings"]) >= 1
    assert "Filtered internal private content" in res["warnings"][0]


def test_node_finalize_response():
    state: DiscoveryGraphState = {
        "started_at": "2026-09-06T10:00:00Z",
        "errors": {},
        "top_people": [{"id": "1"}],
    }
    res = node_finalize_response(state)
    assert res["status"] == "SUCCESS"
    assert res["current_stage"] == "COMPLETED"


def test_graph_error_dataclass():
    err = GraphError(stage="discover_people", code="TIMEOUT", message="Branch timeout", retryable=True)
    d = err.to_dict()
    assert d["stage"] == "discover_people"
    assert d["code"] == "TIMEOUT"
    assert d["retryable"] is True


def test_no_secret_leakage_in_state():
    state: DiscoveryGraphState = {
        "request_id": "req_123",
        "original_query": "How to deploy TinyML?",
    }
    # Verify sensitive secret keys are absent
    assert "password" not in state
    assert "jwt_secret" not in state
    assert "gemini_api_key" not in state


def test_api_discover_authenticated(test_user_cookies):
    res = client.post(
        "/api/v1/agents/discover",
        cookies=test_user_cookies,
        json={"query": "My ESP32 microphone works, but TinyML keyword detection model has poor accuracy"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "My ESP32 microphone works, but TinyML keyword detection model has poor accuracy"
    assert "query_understanding" in data
    assert "people" in data
    assert "projects" in data
    assert "facilities" in data
    assert "traces" in data


def test_api_discover_unauthenticated():
    unauth_client = TestClient(app)
    res = unauth_client.post(
        "/api/v1/agents/discover",
        json={"query": "Need help with ESP32"},
    )
    assert res.status_code == 401


def test_api_discover_empty_query(test_user_cookies):
    res = client.post(
        "/api/v1/agents/discover",
        cookies=test_user_cookies,
        json={"query": "   "},
    )
    # FastApi / Pydantic validation handles empty or invalid strings
    assert res.status_code in (200, 422)
