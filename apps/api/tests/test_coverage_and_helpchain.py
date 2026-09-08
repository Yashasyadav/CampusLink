"""
Phase 9.7 Test Suite: Result Coverage, Candidate Expansion & Help-Chain Quality.

Tests:
1. test_people_candidate_expansion_retrieves_multiple_candidates
2. test_help_chain_decoupled_from_people_count
3. test_help_chain_multi_domain_requires_complementary_chain
4. test_vlsi_facility_retrieval_with_equipment
5. test_non_person_scoring_not_penalized_by_person_formula
6. test_mobile_query_zero_mqtt_leakage
"""

import uuid
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SyncSessionLocal
from app.models.users import User
from app.schemas.agents import (
    IntentEnum,
    ResultTypeEnum,
    QueryUnderstandingResult,
    DiscoveryResponse,
    PeopleCandidate,
    PeopleDiscoveryResult,
    ProjectKnowledgeResult,
    FacilityDiscoveryResult,
)
from app.schemas.matching import MatchingResult
from app.services.matching_service import (
    MatchingService,
    determine_result_composition,
)
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
    if not user:
        user = db_session.query(User).first()
    assert user is not None, "A valid test user must exist in the database."
    return user


@pytest.fixture
def auth_headers(current_user):
    token = create_token(subject=str(current_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def client():
    return TestClient(app)


def test_people_candidate_expansion_retrieves_multiple_candidates(db_session, current_user):
    """Verify complex query returns top 3-5 people candidates rather than starving at 1."""
    service = MatchingService()
    query = "I am struggling with deploying a TinyML keyword spotting model on ESP32 with I2S microphone"
    res = service.analyze(db_session, current_user, query)

    assert len(res.top_people) >= 3, f"Expected at least 3 people candidates, got {len(res.top_people)}"
    assert len(res.top_people) <= 5, f"Expected top people capped at 5, got {len(res.top_people)}"


def test_help_chain_decoupled_from_people_count(db_session, current_user):
    """Verify people candidate count is decoupled from help chain node count."""
    service = MatchingService()
    query = "I am struggling with deploying a TinyML keyword spotting model on ESP32 with I2S microphone"
    res = service.analyze(db_session, current_user, query)

    # People candidates should be 3-5
    assert len(res.top_people) >= 3
    # Help chain should exist
    assert res.help_chain is not None
    assert len(res.help_chain.nodes) >= 1
    # Help chain node count does not have to match people candidate count
    assert len(res.help_chain.nodes) <= 3


def test_help_chain_multi_domain_requires_complementary_chain():
    """Verify construct_help_chain builds a 2-3 step chain when query spans multiple distinct domains."""
    from app.schemas.matching import HelpTypeEnum
    service = MatchingService()

    # Candidate A: Strong in TinyML / ML, but no ESP32 or Audio
    cand_a = MatchingResult(
        candidate_id=str(uuid.uuid4()),
        candidate_type="PERSON",
        title="Dr. Machine Learning",
        subtitle="CSE Department",
        relevance_score=0.85,
        relevance_level="VERY_HIGH",
        matched_skills=["TinyML", "Machine Learning", "TensorFlow Lite"],
        matched_technologies=["TensorFlow"],
        matched_domains=["Artificial Intelligence"],
        evidence_strength="STRONG",
        evidence_count=3,
        explanation="Expert in TinyML models.",
        help_type=HelpTypeEnum.DOMAIN_EXPERTISE,
        strengths=["Model quantization"],
        limitations=[],
    )

    # Candidate B: Strong in ESP32 / Embedded Systems
    cand_b = MatchingResult(
        candidate_id=str(uuid.uuid4()),
        candidate_type="PERSON",
        title="Hardware Engineer",
        subtitle="ECE Department",
        relevance_score=0.78,
        relevance_level="HIGH",
        matched_skills=["ESP32", "Microcontrollers", "Embedded C"],
        matched_technologies=["ESP32", "FreeRTOS"],
        matched_domains=["Embedded Systems"],
        evidence_strength="STRONG",
        evidence_count=2,
        explanation="Expert in ESP32 firmware.",
        help_type=HelpTypeEnum.DEBUGGING_HELP,
        strengths=["Hardware debugging"],
        limitations=[],
    )

    # Candidate C: Audio / DSP specialist
    cand_c = MatchingResult(
        candidate_id=str(uuid.uuid4()),
        candidate_type="PERSON",
        title="DSP Specialist",
        subtitle="ECE Department",
        relevance_score=0.72,
        relevance_level="HIGH",
        matched_skills=["I2S", "Audio Processing", "DSP"],
        matched_technologies=["I2S Microphone", "C++"],
        matched_domains=["Signal Processing"],
        evidence_strength="STRONG",
        evidence_count=2,
        explanation="Expert in audio DSP.",
        help_type=HelpTypeEnum.TECHNICAL_GUIDANCE,
        strengths=["I2S drivers"],
        limitations=[],
    )

    help_chain = service.construct_help_chain(
        query_skills=["TinyML", "ESP32", "Audio Processing"],
        query_tech=["TensorFlow Lite", "ESP32", "I2S"],
        query_domains=["Artificial Intelligence", "Embedded Systems", "Signal Processing"],
        people_candidates=[cand_a, cand_b, cand_c],
        project_candidates=[],
        diagnostic_areas=["Audio Preprocessing", "Hardware Deployment"],
        problem_keywords=["TinyML", "ESP32", "I2S microphone"],
    )

    assert help_chain is not None
    # Because there are 3 domains and 2 diagnostic areas, a single candidate cannot be single_sufficient
    assert help_chain.is_single_candidate_sufficient is False
    assert len(help_chain.nodes) >= 2, f"Expected at least 2 nodes, got {len(help_chain.nodes)}"


def test_vlsi_facility_retrieval_with_equipment(db_session, current_user):
    """Verify VLSI facility query returns facilities as primary with equipment included."""
    service = MatchingService()
    query = "Find labs with equipment for VLSI circuit testing"
    res = service.analyze(db_session, current_user, query)

    assert res.result_composition.primary_result_type == ResultTypeEnum.FACILITIES
    assert len(res.facilities) > 0, "Expected at least one facility result"
    
    # Check that VLSI lab is among results
    facility_names = [f.title for f in res.facilities]
    assert any("vlsi" in name.lower() for name in facility_names), f"VLSI lab missing in {facility_names}"

    # Verify equipment is listed
    vlsi_lab = next(f for f in res.facilities if "vlsi" in f.title.lower())
    assert vlsi_lab.strengths is not None and len(vlsi_lab.strengths) > 0


def test_non_person_scoring_not_penalized_by_person_formula():
    """Verify non-person entities receive genuine scores without being penalized by person formula zeros."""
    service = MatchingService()

    fake_discovery = DiscoveryResponse(
        query="FastAPI web portal project",
        query_understanding=QueryUnderstandingResult(
            intent=IntentEnum.FIND_PROJECT,
            original_query="FastAPI web portal project",
            extracted_skills=["Python", "FastAPI"],
            extracted_technologies=["FastAPI", "PostgreSQL"],
            domain_areas=["Web Development"],
        ),
        people=PeopleDiscoveryResult(candidates=[]),
        projects=ProjectKnowledgeResult(
            projects=[{
                "id": str(uuid.uuid4()),
                "title": "Campus API Portal",
                "technologies": ["FastAPI", "PostgreSQL"],
                "skills": ["Python"],
                "score": 0.85,
                "contributors": ["Alice Student", "Bob Dev"],
            }],
            solutions=[],
        ),
        facilities=FacilityDiscoveryResult(facilities=[]),
        evidence=[],
        traces=[],
    )

    mock_db = MagicMock()
    mock_user = MagicMock()
    mock_user.id = uuid.uuid4()

    # Process matches using analyze logic with precomputed discovery
    res = service.analyze(
        db=mock_db,
        current_user=mock_user,
        query="FastAPI web portal project",
        precomputed_discovery=fake_discovery,
    )

    assert len(res.top_projects) == 1
    proj = res.top_projects[0]
    # In Phase 9.5 and earlier, this project scored ~0.21 because candidate_skills were evaluated with person weights
    # Now it should score >= 0.70 (score_raw 0.85 + boost 0.15)
    assert proj.relevance_score >= 0.70, f"Expected project score >= 0.70, got {proj.relevance_score}"
    assert proj.relevance_level in ["HIGH", "VERY_HIGH"]


def test_mobile_query_zero_mqtt_leakage(db_session, current_user):
    """Verify query for mobile/firebase does not hallucinate or leak MQTT."""
    service = MatchingService()
    query = "I am building a mobile app for my college club and need help with Android UI, Firebase authentication, and deployment."
    res = service.analyze(db_session, current_user, query)

    for p in res.top_people:
        skills_lower = [s.lower() for s in (p.matched_skills or [])]
        tech_lower = [t.lower() for t in (p.matched_technologies or [])]
        assert "mqtt" not in skills_lower, f"LEAKAGE: MQTT found in matched_skills for {p.title}"
        assert "mqtt" not in tech_lower, f"LEAKAGE: MQTT found in matched_technologies for {p.title}"
