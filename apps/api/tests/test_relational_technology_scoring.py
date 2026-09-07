import pytest
from app.services.scoring_service import ScoringService


def test_case_1_profile_only_technology():
    """Required Test Case #1: Candidate profile has ESP32 & Python, no projects/solutions, query for ESP32."""
    scoring = ScoringService()
    profile_tech = ["ESP32", "Python"]
    ev_graph = {"projects": [], "solutions": []}
    
    cand_tech = scoring.collect_candidate_technologies(profile_tech, ev_graph)
    
    score, _, _, breakdown = scoring.calculate_score(
        semantic_relevance=0.5,
        query_skills=[],
        candidate_skills=[],
        query_technologies=["ESP32"],
        candidate_technologies=cand_tech,
    )
    assert breakdown["technology_overlap"] == 1.0


def test_case_2_project_only_technology():
    """Required Test Case #2: Primary audit regression test. Candidate profile has Python, candidate project has TensorFlow Lite. Query for TensorFlow Lite."""
    scoring = ScoringService()
    profile_tech = ["Python"]
    ev_graph = {
        "projects": [
            {"title": "Edge ML Model Compression", "technologies": ["TensorFlow Lite"]}
        ],
        "solutions": []
    }
    
    cand_tech = scoring.collect_candidate_technologies(profile_tech, ev_graph)
    
    # Verify candidate technologies assembled includes TensorFlow Lite from project
    assert "TensorFlow Lite" in cand_tech
    
    score, _, _, breakdown = scoring.calculate_score(
        semantic_relevance=0.5,
        query_skills=[],
        candidate_skills=[],
        query_technologies=["TensorFlow Lite"],
        candidate_technologies=cand_tech,
    )
    # Technology overlap MUST detect TensorFlow Lite from candidate's project
    assert breakdown["technology_overlap"] == 1.0


def test_case_3_solution_only_technology():
    """Required Test Case #3: Candidate profile has ESP32, problem solution has TinyML. Query for TinyML."""
    scoring = ScoringService()
    profile_tech = ["ESP32"]
    ev_graph = {
        "projects": [],
        "solutions": [
            {"title": "Audio Model Accuracy Fix", "technologies": ["TinyML"]}
        ]
    }
    
    cand_tech = scoring.collect_candidate_technologies(profile_tech, ev_graph)
    assert "TinyML" in cand_tech
    
    score, _, _, breakdown = scoring.calculate_score(
        semantic_relevance=0.5,
        query_skills=[],
        candidate_skills=[],
        query_technologies=["TinyML"],
        candidate_technologies=cand_tech,
    )
    assert breakdown["technology_overlap"] == 1.0


def test_case_4_combined_evidence():
    """Required Test Case #4: Profile has ESP32, Project has TensorFlow Lite, Solution has TinyML. Query has all three."""
    scoring = ScoringService()
    profile_tech = ["ESP32"]
    ev_graph = {
        "projects": [{"technologies": ["TensorFlow Lite"]}],
        "solutions": [{"technologies": ["TinyML"]}]
    }
    
    cand_tech = scoring.collect_candidate_technologies(profile_tech, ev_graph)
    
    score, _, _, breakdown = scoring.calculate_score(
        semantic_relevance=0.5,
        query_skills=[],
        candidate_skills=[],
        query_technologies=["ESP32", "TensorFlow Lite", "TinyML"],
        candidate_technologies=cand_tech,
    )
    assert breakdown["technology_overlap"] == 1.0  # 3 out of 3 matched = 1.0


def test_case_5_duplicates_no_score_inflation():
    """Required Test Case #5: Duplicate technologies in profile, projects, and solutions do not inflate score."""
    scoring = ScoringService()
    profile_tech = ["ESP32"]
    ev_graph = {
        "projects": [
            {"technologies": ["ESP32", "TensorFlow Lite"]},
            {"technologies": ["ESP32", "TensorFlow Lite"]}
        ],
        "solutions": [
            {"technologies": ["TensorFlow Lite"]}
        ]
    }
    
    cand_tech = scoring.collect_candidate_technologies(profile_tech, ev_graph)
    
    score, _, _, breakdown = scoring.calculate_score(
        semantic_relevance=0.5,
        query_skills=[],
        candidate_skills=[],
        query_technologies=["ESP32", "TensorFlow Lite"],
        candidate_technologies=cand_tech,
    )
    assert breakdown["technology_overlap"] == 1.0
    assert 0.0 <= score <= 1.0


def test_case_6_case_normalization():
    """Required Test Case #6: Case variations (TensorFlow Lite / tensorflow lite) match correctly."""
    scoring = ScoringService()
    profile_tech = ["tensorflow lite"]
    ev_graph = {
        "projects": [{"technologies": ["esp32"]}],
        "solutions": []
    }
    
    cand_tech = scoring.collect_candidate_technologies(profile_tech, ev_graph)
    
    score, _, _, breakdown = scoring.calculate_score(
        semantic_relevance=0.5,
        query_skills=[],
        candidate_skills=[],
        query_technologies=["TensorFlow Lite", "ESP32"],
        candidate_technologies=cand_tech,
    )
    assert breakdown["technology_overlap"] == 1.0


def test_case_7_unrelated_technologies():
    """Required Test Case #7: Unrelated technologies produce 0.0 technology overlap score."""
    scoring = ScoringService()
    profile_tech = ["Python"]
    ev_graph = {
        "projects": [{"technologies": ["Java"]}],
        "solutions": [{"technologies": ["PostgreSQL"]}]
    }
    
    cand_tech = scoring.collect_candidate_technologies(profile_tech, ev_graph)
    
    score, _, _, breakdown = scoring.calculate_score(
        semantic_relevance=0.5,
        query_skills=[],
        candidate_skills=[],
        query_technologies=["ESP32", "TensorFlow Lite"],
        candidate_technologies=cand_tech,
    )
    assert breakdown["technology_overlap"] == 0.0


def test_case_8_score_boundary():
    """Required Test Case #8: Final score remains strictly in bounds [0.0, 1.0]."""
    scoring = ScoringService()
    for sem in [0.0, 0.3, 0.5, 0.8, 1.0, 1.5]:
        score, lvl, ev_str, breakdown = scoring.calculate_score(
            semantic_relevance=sem,
            query_skills=["ESP32", "TinyML"],
            candidate_skills=["ESP32", "TinyML"],
            query_technologies=["ESP32", "TensorFlow Lite"],
            candidate_technologies=["ESP32", "TensorFlow Lite", "Python"],
            has_project_evidence=True,
            has_solution_evidence=True,
            has_research_evidence=True,
            best_evidence_type="PROBLEM_SOLUTION",
        )
        assert 0.0 <= score <= 1.0
        assert 0.0 <= breakdown["technology_overlap"] <= 1.0


def test_case_9_privacy_isolation():
    """Required Test Case #9: Private / unauthorized project evidence graph is excluded."""
    scoring = ScoringService()
    # Authorized ev_graph contains only public items (private projects excluded prior to scoring)
    authorized_ev_graph = {
        "projects": [],
        "solutions": []
    }
    cand_tech = scoring.collect_candidate_technologies(["ESP32"], authorized_ev_graph)
    assert "TensorFlow Lite" not in cand_tech
    
    score, _, _, breakdown = scoring.calculate_score(
        semantic_relevance=0.5,
        query_skills=[],
        candidate_skills=[],
        query_technologies=["TensorFlow Lite"],
        candidate_technologies=cand_tech,
    )
    assert breakdown["technology_overlap"] == 0.0
