"""
Phase 9.6 Test Suite: Intent-Aware Discovery & Result Composition.

Tests:
1. test_determine_result_composition_mappings
2. test_query_understanding_result_resource_needs
3. test_false_skill_match_eliminated
4. test_false_technology_match_eliminated
5. test_matching_analyze_endpoint_includes_result_composition
6. test_facility_intent_result_composition
7. test_problem_solving_intent_evidence_only_composition
8. test_project_contributors_and_technologies_enrichment
9. test_facility_equipment_and_contacts_enrichment
10. test_privacy_boundary_unsearchable_profile_protection
"""

import uuid
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SyncSessionLocal
from app.models.users import User
from app.models.profiles import Profile
from app.schemas.agents import (
    IntentEnum,
    ResultTypeEnum,
    ResultComposition,
    QueryUnderstandingResult,
    DiscoveryResponse,
    PeopleCandidate,
    PeopleDiscoveryResult,
    ProjectKnowledgeResult,
    FacilityDiscoveryResult,
    Evidence,
)
from app.services.matching_service import (
    MatchingService,
    determine_result_composition,
)
from app.services.search_service import SearchService
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


def test_determine_result_composition_mappings():
    """Verify all IntentEnum values produce valid, deterministic ResultComposition."""
    # 1. FIND_FACILITY & FIND_EQUIPMENT
    comp_fac = determine_result_composition(IntentEnum.FIND_FACILITY)
    assert comp_fac.primary_result_type == ResultTypeEnum.FACILITIES
    assert ResultTypeEnum.PEOPLE in comp_fac.secondary_result_types
    assert ResultTypeEnum.PROJECTS in comp_fac.evidence_only_types
    assert ResultTypeEnum.SOLUTIONS in comp_fac.evidence_only_types

    comp_eq = determine_result_composition(IntentEnum.FIND_EQUIPMENT)
    assert comp_eq.primary_result_type == ResultTypeEnum.FACILITIES

    # 2. FIND_PROJECT
    comp_proj = determine_result_composition(IntentEnum.FIND_PROJECT)
    assert comp_proj.primary_result_type == ResultTypeEnum.PROJECTS
    assert ResultTypeEnum.PEOPLE in comp_proj.secondary_result_types
    assert ResultTypeEnum.RESEARCH in comp_proj.evidence_only_types

    # 3. FIND_RESEARCH
    comp_res = determine_result_composition(IntentEnum.FIND_RESEARCH)
    assert comp_res.primary_result_type == ResultTypeEnum.RESEARCH
    assert ResultTypeEnum.PEOPLE in comp_res.secondary_result_types

    # 4. FIND_SIMILAR_SOLUTION
    comp_sol = determine_result_composition(IntentEnum.FIND_SIMILAR_SOLUTION)
    assert comp_sol.primary_result_type == ResultTypeEnum.SOLUTIONS
    assert ResultTypeEnum.PEOPLE in comp_sol.secondary_result_types
    assert ResultTypeEnum.PROJECTS in comp_sol.secondary_result_types

    # 5. FIND_EXPERTISE_AND_SIMILAR_SOLUTIONS (Problem Solving)
    comp_prob = determine_result_composition(IntentEnum.FIND_EXPERTISE_AND_SIMILAR_SOLUTIONS)
    assert comp_prob.primary_result_type == ResultTypeEnum.PEOPLE
    assert comp_prob.secondary_result_types == []
    assert ResultTypeEnum.SOLUTIONS in comp_prob.evidence_only_types
    assert ResultTypeEnum.PROJECTS in comp_prob.evidence_only_types

    # 6. FIND_PERSON
    comp_per = determine_result_composition(IntentEnum.FIND_PERSON)
    assert comp_per.primary_result_type == ResultTypeEnum.PEOPLE
    assert ResultTypeEnum.PROJECTS in comp_per.secondary_result_types

    # 7. GENERAL_CAMPUS_DISCOVERY
    comp_gen = determine_result_composition(IntentEnum.GENERAL_CAMPUS_DISCOVERY)
    assert comp_gen.primary_result_type == ResultTypeEnum.PEOPLE
    assert len(comp_gen.secondary_result_types) == 4


def test_query_understanding_result_resource_needs():
    """Verify QueryUnderstandingResult captures and serializes resource_needs."""
    qu = QueryUnderstandingResult(
        original_query="Find labs with equipment for VLSI circuit testing",
        intent=IntentEnum.FIND_FACILITY,
        skills=["VLSI", "Circuit Design"],
        domain=["Hardware", "Electronics"],
        technologies=["logic analyzer", "oscilloscope"],
        resource_needs=["logic analyzer", "cleanroom", "probe station"],
    )
    assert len(qu.resource_needs) == 3
    assert "probe station" in qu.resource_needs

    qu_empty = QueryUnderstandingResult(
        original_query="Who knows Python?",
        intent=IntentEnum.FIND_PERSON,
        skills=["Python"],
        domain=["AI"],
        technologies=["PyTorch"],
    )
    assert qu_empty.resource_needs == []


def test_false_skill_match_eliminated(db_session, current_user):
    """
    Test that candidate skills are strictly matched against query terms/skills.
    A candidate with 'MQTT' and 'Embedded C' queried for 'Android' and 'Firebase'
    must NOT have 'MQTT' returned in matched_skills!
    """
    ms = MatchingService()

    other_user_id = uuid.uuid4()
    candidate = PeopleCandidate(
        user_id=other_user_id,
        display_name="Embedded Specialist",
        department="ECE",
        person_evidence_graph={
            "skills": ["MQTT", "Embedded C"],
            "technologies": ["ESP32", "MQTT"],
            "projects": [],
            "solutions": [],
            "research": [],
            "evidence_count": 1,
        },
        evidence=[
            Evidence(
                entity_type="PROFILE",
                entity_id=other_user_id,
                title="Profile",
                source="search_people",
                snippet="Specializes in MQTT and Embedded C",
                score=0.8,
            )
        ],
    )

    qu = QueryUnderstandingResult(
        original_query="I need help with Android and Firebase authentication",
        intent=IntentEnum.FIND_PERSON,
        skills=["Android", "Firebase"],
        technologies=["Firebase Auth"],
        domain=["Mobile Development"],
        problem_keywords=["mobile app", "authentication"],
        diagnostic_areas=[],
    )

    precomputed = DiscoveryResponse(
        query="I need help with Android and Firebase authentication",
        query_understanding=qu,
        people=PeopleDiscoveryResult(candidates=[candidate]),
        projects=ProjectKnowledgeResult(),
        facilities=FacilityDiscoveryResult(),
    )

    result = ms.analyze(
        db=db_session,
        current_user=current_user,
        query="I need help with Android and Firebase authentication",
        precomputed_discovery=precomputed,
    )

    if result.top_people:
        # matched_skills must NOT contain MQTT or Embedded C
        person = result.top_people[0]
        assert "MQTT" not in person.matched_skills
        assert "Embedded C" not in person.matched_skills
        assert person.matched_skills == []


def test_false_technology_match_eliminated(db_session, current_user):
    """
    Test that candidate technologies are not artificially defaulted when no overlap exists.
    """
    ms = MatchingService()

    other_user_id = uuid.uuid4()
    candidate = PeopleCandidate(
        user_id=other_user_id,
        display_name="Web Engineer",
        department="CSE",
        person_evidence_graph={
            "skills": ["React"],
            "technologies": ["Next.js", "TailwindCSS"],
            "projects": [],
            "solutions": [],
            "research": [],
            "evidence_count": 1,
        },
        evidence=[
            Evidence(
                entity_type="PROFILE",
                entity_id=other_user_id,
                title="Profile",
                source="search_people",
                snippet="React developer",
                score=0.8,
            )
        ],
    )

    qu = QueryUnderstandingResult(
        original_query="PyTorch GPU acceleration expert",
        intent=IntentEnum.FIND_PERSON,
        skills=["PyTorch"],
        technologies=["CUDA", "GPU"],
        domain=["Machine Learning"],
        problem_keywords=["GPU acceleration"],
        diagnostic_areas=[],
    )

    precomputed = DiscoveryResponse(
        query="PyTorch GPU acceleration expert",
        query_understanding=qu,
        people=PeopleDiscoveryResult(candidates=[candidate]),
        projects=ProjectKnowledgeResult(),
        facilities=FacilityDiscoveryResult(),
    )

    result = ms.analyze(
        db=db_session,
        current_user=current_user,
        query="PyTorch GPU acceleration expert",
        precomputed_discovery=precomputed,
    )

    if result.top_people:
        person = result.top_people[0]
        assert "Next.js" not in person.matched_technologies
        assert "TailwindCSS" not in person.matched_technologies
        assert person.matched_technologies == []


def test_matching_analyze_endpoint_includes_result_composition(client, auth_headers):
    """Verify /api/v1/matching/analyze response contains result_composition schema."""
    response = client.post(
        "/api/v1/matching/analyze",
        headers=auth_headers,
        json={"query": "Who on campus knows TinyML and ESP32?"},
    )
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()

    assert "result_composition" in data
    assert data["result_composition"] is not None
    rc = data["result_composition"]
    assert "primary_result_type" in rc
    assert "secondary_result_types" in rc
    assert "evidence_only_types" in rc
    assert rc["primary_result_type"] == "PEOPLE"


def test_facility_intent_result_composition(client, auth_headers):
    """Verify facility query yields FACILITIES as primary_result_type."""
    response = client.post(
        "/api/v1/matching/analyze",
        headers=auth_headers,
        json={"query": "Find labs with equipment for VLSI circuit testing"},
    )
    assert response.status_code == 200
    data = response.json()

    assert "result_composition" in data
    rc = data["result_composition"]
    qu = data.get("understanding") or data.get("query_understanding")
    if qu and qu.get("intent") in ["FIND_FACILITY", "FIND_EQUIPMENT"]:
        assert rc["primary_result_type"] == "FACILITIES"
        assert "SOLUTIONS" in rc["evidence_only_types"]
        assert "PROJECTS" in rc["evidence_only_types"]


def test_problem_solving_intent_evidence_only_composition():
    """Verify problem solving query marks solutions, projects, and research as evidence-only."""
    rc = determine_result_composition(IntentEnum.FIND_EXPERTISE_AND_SIMILAR_SOLUTIONS)
    assert rc.primary_result_type == ResultTypeEnum.PEOPLE
    assert rc.secondary_result_types == []
    assert ResultTypeEnum.SOLUTIONS in rc.evidence_only_types
    assert ResultTypeEnum.PROJECTS in rc.evidence_only_types
    assert ResultTypeEnum.RESEARCH in rc.evidence_only_types


def test_project_contributors_and_technologies_enrichment(client, auth_headers):
    """Verify matched projects contain technologies and contributors in metadata."""
    response = client.post(
        "/api/v1/matching/analyze",
        headers=auth_headers,
        json={"query": "What projects have students built using ESP32?"},
    )
    assert response.status_code == 200
    data = response.json()

    projects = data.get("top_projects", []) or data.get("projects", [])
    if projects:
        p = projects[0]
        metadata = p.get("metadata", {})
        assert "contributors" in metadata
        assert "technologies" in metadata
        assert isinstance(metadata["contributors"], list)
        assert isinstance(metadata["technologies"], list)


def test_facility_equipment_and_contacts_enrichment(client, auth_headers):
    """Verify matched facilities contain equipment and responsible_user in metadata."""
    response = client.post(
        "/api/v1/matching/analyze",
        headers=auth_headers,
        json={"query": "Find labs with equipment for VLSI circuit testing"},
    )
    assert response.status_code == 200
    data = response.json()

    facilities = data.get("facilities", [])
    if facilities:
        f = facilities[0]
        metadata = f.get("metadata", {})
        assert "equipment" in metadata
        assert "responsible_user" in metadata
        assert isinstance(metadata["equipment"], list)


def test_privacy_boundary_unsearchable_profile_protection(db_session):
    """
    Verify that unsearchable profiles are protected when hydrating search results.
    """
    mock_provider = MagicMock()
    ss = SearchService(provider=mock_provider)

    # Create mock user with unsearchable profile
    mock_user = MagicMock()
    mock_profile = MagicMock()
    mock_profile.searchable = False
    mock_profile.full_name = "Secret Contributor"
    mock_user.profile = mock_profile

    mock_contributor = MagicMock()
    mock_contributor.user = mock_user

    mock_project = MagicMock()
    mock_project.title = "Confidential Project"
    mock_project.description = "Test Description"
    mock_project.status = MagicMock(value="IN_PROGRESS")
    mock_project.project_type = MagicMock(value="ACADEMIC")
    mock_project.visibility = MagicMock(value="CAMPUS")
    mock_project.contributors = [mock_contributor]
    mock_project.technologies = []

    # Mock db.get to return mock_project
    mock_db = MagicMock()
    mock_db.get.return_value = mock_project

    item = ss._hydrate_entity(mock_db, "PROJECT", uuid.uuid4(), 0.9, None)
    assert item is not None
    # The contributor with searchable=False must NOT appear in contributors
    assert "Secret Contributor" not in item.metadata["contributors"]
    assert len(item.metadata["contributors"]) == 0
