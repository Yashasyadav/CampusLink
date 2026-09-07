import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import MATCHING_WEIGHTS
from app.services.scoring_service import ScoringService
from app.services.evidence_service import EvidenceService
from app.services.explanation_service import ExplanationService
from app.services.matching_service import MatchingService
from app.schemas.matching import EvidenceItem, HelpTypeEnum, MatchingResult
from app.schemas.agents import Evidence, DiscoveryResponse, QueryUnderstandingResult, PeopleDiscoveryResult, ProjectKnowledgeResult, FacilityDiscoveryResult

client = TestClient(app)


@pytest.fixture
def test_user_cookies():
    """Register and login primary test user."""
    email = f"matching_user_{uuid.uuid4().hex[:8]}@campuslink.edu"
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!", "role": "STUDENT"},
    )
    assert reg.status_code == 201
    return reg.cookies


# ============================================================
# PHASE 8 MATCHING & EXPLANATION UNIT & INTEGRATION TESTS
# ============================================================

def test_scoring_formula_exact():
    """Verify deterministic scoring matches documented config weights exactly."""
    scoring = ScoringService()
    # Given:
    # semantic = 0.90
    # query_skills = ["ESP32", "TinyML"], candidate_skills = ["ESP32", "TinyML"] -> s_skill = 1.0
    # query_tech = ["C++", "TensorFlow"], candidate_tech = ["C++"] -> s_tech = 0.5
    # has_project = True -> 1.0
    # has_solution = False -> 0.0
    # has_research = False -> 0.0
    score, level, ev_strength, breakdown = scoring.calculate_score(
        semantic_relevance=0.90,
        query_skills=["ESP32", "TinyML"],
        candidate_skills=["ESP32", "TinyML"],
        query_technologies=["C++", "TensorFlow"],
        candidate_technologies=["C++"],
        has_project_evidence=True,
        has_solution_evidence=False,
        has_research_evidence=False,
        best_evidence_type="PROJECT",
    )

    expected = (
        MATCHING_WEIGHTS["semantic_relevance"] * 0.90
        + MATCHING_WEIGHTS["skill_overlap"] * 1.0
        + MATCHING_WEIGHTS["technology_overlap"] * 0.5
        + MATCHING_WEIGHTS["project_evidence"] * 1.0
        + MATCHING_WEIGHTS["solution_evidence"] * 0.0
        + MATCHING_WEIGHTS["research_evidence"] * 0.0
    )
    expected = round(expected, 4)

    assert score == expected
    assert level in ("High relevance", "Strong match")
    assert "evidence" in ev_strength.lower() or ev_strength in ("Strong", "Moderate")


def test_skill_matching_overlap():
    scoring = ScoringService()
    score, _, _, breakdown = scoring.calculate_score(
        semantic_relevance=0.5,
        query_skills=["Python", "FastAPI", "Docker"],
        candidate_skills=["Python", "FastAPI"],
        query_technologies=[],
        candidate_technologies=[],
        has_project_evidence=False,
        has_solution_evidence=False,
    )
    # 2 out of 3 matched = 0.6667
    assert round(breakdown["skill_overlap"], 2) == 0.67


def test_technology_matching_overlap():
    scoring = ScoringService()
    score, _, _, breakdown = scoring.calculate_score(
        semantic_relevance=0.5,
        query_skills=[],
        candidate_skills=[],
        query_technologies=["ESP32", "LoRa"],
        candidate_technologies=["ESP32", "LoRa"],
        has_project_evidence=False,
        has_solution_evidence=False,
    )
    assert breakdown["technology_overlap"] == 1.0


def test_semantic_relevance_clamping():
    scoring = ScoringService()
    score, _, _, breakdown = scoring.calculate_score(
        semantic_relevance=1.8,  # Out of bounds
        query_skills=[],
        candidate_skills=[],
        query_technologies=[],
        candidate_technologies=[],
        has_project_evidence=False,
        has_solution_evidence=False,
    )
    assert breakdown["semantic_relevance"] == 1.0
    assert 0.0 <= score <= 1.0


def test_project_evidence_weight():
    scoring = ScoringService()
    _, _, _, breakdown_with = scoring.calculate_score(
        semantic_relevance=0.5,
        query_skills=[],
        candidate_skills=[],
        query_technologies=[],
        candidate_technologies=[],
        has_project_evidence=True,
        has_solution_evidence=False,
    )
    assert breakdown_with["project_evidence"] == 1.0


def test_solution_evidence_weight():
    scoring = ScoringService()
    _, _, _, breakdown_with = scoring.calculate_score(
        semantic_relevance=0.5,
        query_skills=[],
        candidate_skills=[],
        query_technologies=[],
        candidate_technologies=[],
        has_project_evidence=False,
        has_solution_evidence=True,
    )
    assert breakdown_with["solution_evidence"] == 1.0


def test_score_normalization():
    scoring = ScoringService()
    for s in [0.0, 0.5, 0.94, 1.0]:
        sc, lvl, _, _ = scoring.calculate_score(s, [], [], [], [], False, False)
        assert 0.0 <= sc <= 1.0
        assert lvl in ("High relevance", "Strong match", "Relevant", "Potential match")


def test_evidence_aggregation_privacy():
    raw_ev = [
        Evidence(
            entity_type="PROJECT",
            entity_id=uuid.uuid4(),
            title="ESP32 Classifier",
            source="search_projects",
            snippet="Built an ESP32 audio classification system.",
            score=0.92,
        ),
        Evidence(
            entity_type="PROFILE",
            entity_id=uuid.uuid4(),
            title="Private Resume",
            source="resume_search",
            snippet="PRIVATE_RESUME raw text content",
            score=0.99,
        ),
    ]

    formatted = EvidenceService.format_evidence_items(
        candidate_id="cand-123",
        candidate_type="PERSON",
        raw_evidences=raw_ev,
        candidate_meta={"display_name": "Test Candidate"},
    )

    # PRIVATE_RESUME item must be filtered out
    assert len(formatted) == 1
    assert formatted[0].source_title == "ESP32 Classifier"
    assert "PRIVATE_RESUME" not in formatted[0].snippet


def test_explanation_generation_grounding():
    exp_service = ExplanationService()
    ev_item = EvidenceItem(
        source_type="PROJECT",
        source_id="p-1",
        source_title="TinyML Keyword Detector",
        snippet="Built MFCC feature extractor on ESP32",
        relevance=0.90,
    )
    text, help_type, strengths, limitations = exp_service.generate_explanation(
        query="My ESP32 TinyML keyword detection model has poor accuracy",
        candidate_title="Student Engineer",
        candidate_type="PERSON",
        relevance_score=0.94,
        relevance_level="High relevance",
        matched_skills=["TinyML", "ESP32"],
        matched_technologies=["TensorFlow Lite"],
        evidence_items=[ev_item],
    )

    assert "TinyML" in text or "ESP32" in text or "High relevance" in text
    assert help_type in (HelpTypeEnum.SOFTWARE_SUPPORT, HelpTypeEnum.HARDWARE_SUPPORT, HelpTypeEnum.TECHNICAL_GUIDANCE)
    assert len(strengths) >= 1


def test_explanation_missing_evidence_fallback():
    exp_service = ExplanationService()
    text, help_type, strengths, limitations = exp_service.generate_explanation(
        query="Need help with Python",
        candidate_title="Dev Candidate",
        candidate_type="PERSON",
        relevance_score=0.60,
        relevance_level="Relevant",
        matched_skills=["Python"],
        matched_technologies=[],
        evidence_items=[],
    )

    assert "Relevant" in text
    assert "shared expertise in Python" in text or "shared skills" in text


def test_no_hallucinated_evidence_guardrail():
    exp_service = ExplanationService()
    ev = EvidenceItem(
        source_type="PROJECT",
        source_id="p-2",
        source_title="Web App",
        snippet="Built a simple Web App with Python",
        relevance=0.70,
    )
    text, _, _, _ = exp_service.generate_explanation(
        query="Quantum Computing Optimization",
        candidate_title="Python Dev",
        candidate_type="PERSON",
        relevance_score=0.60,
        relevance_level="Relevant",
        matched_skills=["Python"],
        matched_technologies=[],
        evidence_items=[ev],
    )

    # Must not falsely claim quantum computing expertise
    assert "quantum computing expert" not in text.lower()


def test_help_chain_multi_candidate():
    service = MatchingService()
    cand1 = MatchingResult(
        candidate_id="c1",
        candidate_type="PERSON",
        title="Hardware Dev",
        relevance_score=0.90,
        relevance_level="High relevance",
        matched_skills=["ESP32", "Embedded Systems"],
        explanation="Hardware expert",
    )
    cand2 = MatchingResult(
        candidate_id="c2",
        candidate_type="PERSON",
        title="Audio Engineer",
        relevance_score=0.88,
        relevance_level="Strong match",
        matched_skills=["Audio Processing", "DSP"],
        explanation="Audio expert",
    )
    cand3 = MatchingResult(
        candidate_id="c3",
        candidate_type="PERSON",
        title="ML Engineer",
        relevance_score=0.85,
        relevance_level="Strong match",
        matched_skills=["TinyML", "Model Optimization"],
        explanation="TinyML expert",
    )

    chain = service.construct_help_chain(
        query_skills=["ESP32", "Audio Processing", "TinyML"],
        query_tech=["ESP32"],
        query_domains=["Embedded"],
        people_candidates=[cand1, cand2, cand3],
        project_candidates=[],
    )

    assert chain is not None
    assert len(chain.nodes) >= 2
    assert chain.is_single_candidate_sufficient is False
    assert "ESP32" in chain.needed_capabilities or "Audio Processing" in chain.needed_capabilities


def test_help_chain_single_candidate_sufficient():
    service = MatchingService()
    top_cand = MatchingResult(
        candidate_id="c1",
        candidate_type="PERSON",
        title="Full Stack Embedded Dev",
        relevance_score=0.96,
        relevance_level="High relevance",
        matched_skills=["ESP32", "Audio Processing", "TinyML"],
        explanation="Covers all areas",
    )

    chain = service.construct_help_chain(
        query_skills=["ESP32", "Audio Processing", "TinyML"],
        query_tech=["ESP32"],
        query_domains=["Embedded"],
        people_candidates=[top_cand],
        project_candidates=[],
    )

    assert chain is not None
    assert len(chain.nodes) == 1
    assert chain.is_single_candidate_sufficient is True


def test_api_matching_analyze_authenticated(test_user_cookies):
    res = client.post(
        "/api/v1/matching/analyze",
        cookies=test_user_cookies,
        json={"query": "My ESP32 microphone works, but TinyML keyword detection model has poor accuracy"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "My ESP32 microphone works, but TinyML keyword detection model has poor accuracy"
    assert "understanding" in data
    assert "top_people" in data
    assert "top_projects" in data
    assert "top_solutions" in data
    assert "facilities" in data
    assert "metadata" in data


def test_api_matching_analyze_unauthenticated():
    fresh_client = TestClient(app)
    res = fresh_client.post(
        "/api/v1/matching/analyze",
        json={"query": "Need ESP32 help"},
    )
    assert res.status_code == 401


def test_api_matching_analyze_empty_query(test_user_cookies):
    res = client.post(
        "/api/v1/matching/analyze",
        cookies=test_user_cookies,
        json={"query": "   "},
    )
    assert res.status_code == 422
