import logging
from typing import List, Dict, Any, Tuple
from app.core.config import MATCHING_WEIGHTS

logger = logging.getLogger(__name__)

# Evidence Quality Ranking Hierarchy
EVIDENCE_QUALITY_HIERARCHY = {
    "PROBLEM_SOLUTION": 1.0,
    "PROJECT": 0.85,
    "RESEARCH": 0.75,
    "PROFILE_SKILL": 0.65,
    "EQUIPMENT": 0.50,
    "FACILITY": 0.50,
    "PROFILE": 0.35,
}


class ScoringService:
    """
    Deterministic scoring engine for Phase 8 Matching Intelligence.
    Calculates candidate relevance scores strictly through mathematical weights.
    LLMs are NEVER allowed to directly invent or alter final scores.
    """

    def __init__(self, weights: Dict[str, float] = None):
        self.weights = weights or MATCHING_WEIGHTS

    def calculate_score(
        self,
        semantic_relevance: float,
        query_skills: List[str],
        candidate_skills: List[str],
        query_technologies: List[str],
        candidate_technologies: List[str],
        has_project_evidence: bool,
        has_solution_evidence: bool,
        best_evidence_type: str = "PROFILE",
    ) -> Tuple[float, str, str, Dict[str, float]]:
        """
        Calculates a deterministic relevance score normalized from 0.0 to 1.0.

        Returns:
            Tuple of (final_score, relevance_level, evidence_strength, breakdown_dict)
        """
        # 1. Semantic relevance (0.0 to 1.0)
        s_semantic = max(0.0, min(1.0, float(semantic_relevance)))

        # 2. Skill overlap ratio
        q_skills_set = {s.lower().strip() for s in query_skills if s.strip()}
        c_skills_set = {s.lower().strip() for s in candidate_skills if s.strip()}
        if q_skills_set:
            s_skill = len(q_skills_set.intersection(c_skills_set)) / len(q_skills_set)
        else:
            s_skill = 1.0 if c_skills_set else 0.5
        s_skill = max(0.0, min(1.0, s_skill))

        # 3. Technology overlap ratio
        q_tech_set = {t.lower().strip() for t in query_technologies if t.strip()}
        c_tech_set = {t.lower().strip() for t in candidate_technologies if t.strip()}
        if q_tech_set:
            s_tech = len(q_tech_set.intersection(c_tech_set)) / len(q_tech_set)
        else:
            s_tech = 1.0 if c_tech_set else 0.5
        s_tech = max(0.0, min(1.0, s_tech))

        # 4. Project evidence
        s_project = 1.0 if has_project_evidence else 0.0

        # 5. Solution evidence
        s_solution = 1.0 if has_solution_evidence else 0.0

        # 6. Evidence quality
        s_evidence = EVIDENCE_QUALITY_HIERARCHY.get(best_evidence_type.upper(), 0.35)

        # Weighted Sum
        final_score = (
            self.weights["semantic_relevance"] * s_semantic
            + self.weights["skill_overlap"] * s_skill
            + self.weights["technology_overlap"] * s_tech
            + self.weights["project_evidence"] * s_project
            + self.weights["solution_evidence"] * s_solution
            + self.weights["evidence_quality"] * s_evidence
        )
        final_score = round(max(0.0, min(1.0, final_score)), 4)

        # Determine human readable relevance level
        relevance_level = self.get_relevance_level(final_score)

        # Determine evidence strength label
        evidence_strength = self.get_evidence_strength(s_evidence, final_score)

        breakdown = {
            "semantic_relevance": s_semantic,
            "skill_overlap": s_skill,
            "technology_overlap": s_tech,
            "project_evidence": s_project,
            "solution_evidence": s_solution,
            "evidence_quality": s_evidence,
            "final_score": final_score,
        }

        return final_score, relevance_level, evidence_strength, breakdown

    @staticmethod
    def get_relevance_level(score: float) -> str:
        """Map normalized score (0.0 to 1.0) to user-facing relevance text without fake precision."""
        if score >= 0.85:
            return "High relevance"
        elif score >= 0.70:
            return "Strong match"
        elif score >= 0.50:
            return "Relevant"
        else:
            return "Potential match"

    @staticmethod
    def get_evidence_strength(evidence_quality_score: float, final_score: float) -> str:
        """Classify evidence strength."""
        combined = (evidence_quality_score + final_score) / 2.0
        if combined >= 0.75:
            return "Strong"
        elif combined >= 0.50:
            return "Moderate"
        else:
            return "Basic"
