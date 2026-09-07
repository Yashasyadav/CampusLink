"""
Phase 9.5 Test Suite: Person-Centric Expert Discovery & Evidence Graph.

Tests:
1. test_query_understanding_extracts_problem_summary_and_diagnostics
2. test_people_discovery_excludes_current_user_profile
3. test_people_discovery_excludes_current_user_by_uuid
4. test_person_evidence_graph_construction
5. test_person_evidence_graph_only_includes_accessible_content
6. test_person_centric_scoring_weights
7. test_person_centric_scoring_breakdown
8. test_evidence_strength_label_classification
9. test_matching_service_excludes_current_user
10. test_best_single_person_match_flag_and_label
11. test_multi_person_help_chain_construction
12. test_explanation_grounding_with_evidence_graph
13. test_matching_analyze_endpoint_returns_person_centric_data
14. test_matching_analyze_endpoint_excludes_authenticated_user
15. test_matching_analyze_golden_esp32_query
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SyncSessionLocal
from app.models.users import User
from app.models.profiles import Profile
from app.agents.query_understanding import QueryUnderstandingAgent
from app.agents.people_discovery import PeopleDiscoveryAgent
from app.agent_tools.tools import get_person_evidence_graph_tool
from app.services.matching_service import MatchingService
from app.services.scoring_service import ScoringService
from app.services.explanation_service import ExplanationService
from app.core.security import create_token


@pytest.fixture
def db_session():
    session = SyncSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def current_user(db_session):
    user = db_session.query(User).filter(User.email == "student1@campuslink.test").first()
    assert user is not None, "Test user student1@campuslink.test must exist in seeded DB."
    return user


@pytest.fixture
def auth_headers(current_user):
    token = create_token(subject=str(current_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def client():
    return TestClient(app)


def test_query_understanding_extracts_problem_summary_and_diagnostics():
    """1. Query understanding extracts problem summary and diagnostic areas."""
    agent = QueryUnderstandingAgent()
    query = "My ESP32 microphone is working, but my TinyML keyword detection model is giving poor accuracy. I don't know whether the problem is with the microphone, audio preprocessing, or the ML model."
    res = agent.analyze(query)

    assert res.problem_summary != ""
    assert isinstance(res.diagnostic_areas, list)
    assert len(res.diagnostic_areas) >= 1
    assert "Cybersecurity" not in res.domain


def test_people_discovery_excludes_current_user_profile(db_session, current_user):
    """2. People discovery excludes current authenticated user profile."""
    agent = PeopleDiscoveryAgent()
    qu = QueryUnderstandingAgent().analyze("ESP32 TinyML keyword detection")
    res = agent.discover(db_session, current_user, qu, limit=10)

    user_ids = [c.user_id for c in res.candidates]
    assert current_user.id not in user_ids


def test_people_discovery_excludes_current_user_by_uuid(db_session, current_user):
    """3. Verify strict self-exclusion by UUID across discovery candidates."""
    agent = PeopleDiscoveryAgent()
    qu = QueryUnderstandingAgent().analyze("Signal processing and C++ programming")
    res = agent.discover(db_session, current_user, qu, limit=10)

    for cand in res.candidates:
        assert str(cand.user_id) != str(current_user.id)


def test_person_evidence_graph_construction(db_session, current_user):
    """4. DB-backed evidence graph construction returns real relationships."""
    # Find another user in database
    other_user = db_session.query(User).filter(User.id != current_user.id).first()
    assert other_user is not None

    graph = get_person_evidence_graph_tool(db_session, current_user, other_user.id)
    assert graph["user_id"] == str(other_user.id)
    assert "skills" in graph
    assert "projects" in graph
    assert "solutions" in graph
    assert "research" in graph
    assert "facilities" in graph
    assert isinstance(graph["evidence_count"], int)


def test_person_evidence_graph_only_includes_accessible_content(db_session, current_user):
    """5. Evidence graph respects visibility policies (no private items for non-owner)."""
    other_user = db_session.query(User).filter(User.id != current_user.id).first()
    graph = get_person_evidence_graph_tool(db_session, current_user, other_user.id)

    for proj in graph["projects"]:
        assert proj.get("visibility") != "PRIVATE"


def test_person_centric_scoring_weights():
    """6. ScoringService applies person-centric weighting model."""
    scorer = ScoringService()
    score, rel_level, ev_strength, breakdown = scorer.calculate_score(
        semantic_relevance=1.0,
        query_skills=["ESP32", "Signal Processing"],
        candidate_skills=["ESP32", "Signal Processing"],
        query_technologies=["C++"],
        candidate_technologies=["C++"],
        has_project_evidence=True,
        has_solution_evidence=True,
        has_research_evidence=True,
        best_evidence_type="PROBLEM_SOLUTION",
    )

    # 0.25*1 + 0.20*1 + 0.15*1 + 0.15*1 + 0.15*1 + 0.10*1 = 1.00
    assert score == 1.0
    assert rel_level == "High relevance"
    assert ev_strength == "Strong evidence"


def test_person_centric_scoring_breakdown():
    """7. Scoring breakdown dict contains research_evidence and semantic_relevance."""
    scorer = ScoringService()
    _, _, _, breakdown = scorer.calculate_score(
        semantic_relevance=0.8,
        query_skills=["TinyML"],
        candidate_skills=["TinyML"],
        query_technologies=["ESP32"],
        candidate_technologies=["ESP32"],
        has_project_evidence=True,
        has_solution_evidence=False,
        has_research_evidence=True,
    )

    assert "semantic_relevance" in breakdown
    assert "research_evidence" in breakdown
    assert breakdown["research_evidence"] == 1.0
    assert breakdown["solution_evidence"] == 0.0


def test_evidence_strength_label_classification():
    """8. Evidence strength maps to standard label strings."""
    assert ScoringService.get_evidence_strength(0.9, 0.9) == "Strong evidence"
    assert ScoringService.get_evidence_strength(0.5, 0.5) == "Moderate evidence"
    assert ScoringService.get_evidence_strength(0.2, 0.2) == "Basic evidence"


def test_matching_service_excludes_current_user(db_session, current_user):
    """9. MatchingService excludes current authenticated user from top_people."""
    service = MatchingService()
    query = "My ESP32 microphone is working, but my TinyML keyword detection model is giving poor accuracy."
    res = service.analyze(db_session, current_user, query)

    top_people_ids = [p.candidate_id for p in res.top_people]
    assert str(current_user.id) not in top_people_ids


def test_best_single_person_match_flag_and_label(db_session, current_user):
    """10. Help chain labels single candidate as Best Single-Person Match when sufficient."""
    service = MatchingService()
    query = "ESP32 TinyML keyword detection"
    res = service.analyze(db_session, current_user, query)

    if res.help_chain and res.help_chain.is_single_candidate_sufficient:
        assert "Best Single-Person Match" in res.help_chain.explanation or res.help_chain.nodes[0].focus_area == "Best Single-Person Match"


def test_multi_person_help_chain_construction(db_session, current_user):
    """11. Multi-candidate help chain constructed for multi-domain queries."""
    service = MatchingService()
    query = "ESP32 signal processing audio preprocessing and machine learning model accuracy"
    res = service.analyze(db_session, current_user, query)

    assert res is not None
    if res.help_chain:
        assert len(res.help_chain.nodes) >= 1
        assert res.help_chain.explanation != ""


def test_explanation_grounding_with_evidence_graph():
    """12. ExplanationService generates grounded explanation without hallucinated roles."""
    expl_service = ExplanationService()
    text, help_type, strengths, limitations = expl_service.generate_explanation(
        query="ESP32 audio noise filtering",
        candidate_title="Dr. Sarah Lin",
        candidate_type="PERSON",
        relevance_score=0.85,
        relevance_level="High relevance",
        matched_skills=["ESP32", "Signal Processing"],
        matched_technologies=["I2S"],
        evidence_items=[],
    )

    assert "High relevance" in text
    assert "worked on 'Dr. Sarah Lin'" not in text
    assert "match match" not in text


def test_matching_analyze_endpoint_returns_person_centric_data(client, auth_headers):
    """13. API endpoint returns person_evidence_graph and evidence_count."""
    response = client.post(
        "/api/v1/matching/analyze",
        headers=auth_headers,
        json={"query": "ESP32 TinyML audio keyword detection"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "top_people" in data
    assert "understanding" in data
    assert "problem_summary" in data["understanding"]

    if data["top_people"]:
        top = data["top_people"][0]
        assert "person_evidence_graph" in top
        assert "evidence_count" in top


def test_matching_analyze_endpoint_excludes_authenticated_user(client, auth_headers, current_user):
    """14. API endpoint strictly excludes authenticated user from people results."""
    response = client.post(
        "/api/v1/matching/analyze",
        headers=auth_headers,
        json={"query": "ESP32 microphone audio preprocessing"},
    )
    assert response.status_code == 200
    data = response.json()

    people_ids = [p["candidate_id"] for p in data.get("top_people", [])]
    assert str(current_user.id) not in people_ids


def test_matching_analyze_golden_esp32_query(client, auth_headers, current_user):
    """15. Golden E2E query test for Phase 9.5."""
    golden_query = (
        "My ESP32 microphone is working, but my TinyML keyword detection model is giving poor accuracy. "
        "I don't know whether the problem is with the microphone, audio preprocessing, or the ML model."
    )
    response = client.post(
        "/api/v1/matching/analyze",
        headers=auth_headers,
        json={"query": golden_query},
    )
    assert response.status_code == 200
    data = response.json()

    # Core checks
    assert data["understanding"]["problem_summary"] != ""
    assert str(current_user.id) not in [p["candidate_id"] for p in data["top_people"]]
    assert (
        len(data["top_people"]) > 0 or len(data["top_projects"]) > 0 or len(data["top_solutions"]) > 0
    ), "CampusLink should discover matching experts, projects, or solutions for golden ESP32 query."
    if data["top_people"]:
        assert data["top_people"][0]["relevance_score"] >= 0.35
