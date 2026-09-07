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

    @staticmethod
    def collect_candidate_technologies(
        candidate_technologies: List[str] = None,
        person_evidence_graph: Dict[str, Any] = None,
    ) -> List[str]:
        """
        Collects, normalizes, and deduplicates all candidate technology evidence
        from profile technologies, contributed projects, and authored problem solutions.
        """
        all_techs = []
        if candidate_technologies:
            all_techs.extend(candidate_technologies)

        if person_evidence_graph and isinstance(person_evidence_graph, dict):
            for proj in person_evidence_graph.get("projects", []):
                if isinstance(proj, dict) and "technologies" in proj:
                    techs = proj.get("technologies", [])
                    if isinstance(techs, list):
                        all_techs.extend(techs)
            for sol in person_evidence_graph.get("solutions", []):
                if isinstance(sol, dict) and "technologies" in sol:
                    techs = sol.get("technologies", [])
                    if isinstance(techs, list):
                        all_techs.extend(techs)

        seen = set()
        cleaned = []
        for t in all_techs:
            if not t:
                continue
            s_clean = str(t).strip()
            if not s_clean:
                continue
            key = s_clean.lower()
            if key not in seen:
                seen.add(key)
                cleaned.append(s_clean)

        return cleaned

    def calculate_score(
        self,
        semantic_relevance: float,
        query_skills: List[str],
        candidate_skills: List[str],
        query_technologies: List[str],
        candidate_technologies: List[str],
        has_project_evidence: bool = False,
        has_solution_evidence: bool = False,
        has_research_evidence: bool = False,
        best_evidence_type: str = "PROFILE",
        person_evidence_graph: Dict[str, Any] = None,
    ) -> Tuple[float, str, str, Dict[str, float]]:
        """
        Calculates a deterministic relevance score normalized from 0.0 to 1.0.

        Returns:
            Tuple of (final_score, relevance_level, evidence_strength, breakdown_dict)
        """
        # Collect and deduplicate candidate technologies including relational evidence graph
        if person_evidence_graph:
            candidate_technologies = self.collect_candidate_technologies(
                candidate_technologies=candidate_technologies,
                person_evidence_graph=person_evidence_graph,
            )
        # 1. Semantic / problem statement relevance (0.0 to 1.0)
        raw_sem = float(semantic_relevance)
        if 0.0 < raw_sem < 0.35:
            s_semantic = max(0.0, min(1.0, raw_sem * 4.0))
        else:
            s_semantic = max(0.0, min(1.0, raw_sem))

        # 2. Skill overlap ratio
        q_skills_set = {s.lower().strip() for s in query_skills if s.strip()}
        c_skills_set = {s.lower().strip() for s in candidate_skills if s.strip()}
        if q_skills_set:
            s_skill = len(q_skills_set.intersection(c_skills_set)) / len(q_skills_set)
        else:
            s_skill = 0.5 if c_skills_set else 0.0
        s_skill = max(0.0, min(1.0, s_skill))

        # 3. Technology overlap ratio
        q_tech_set = {t.lower().strip() for t in query_technologies if t.strip()}
        c_tech_set = {t.lower().strip() for t in candidate_technologies if t.strip()}
        if q_tech_set:
            s_tech = len(q_tech_set.intersection(c_tech_set)) / len(q_tech_set)
        else:
            s_tech = 0.5 if c_tech_set else 0.0
        s_tech = max(0.0, min(1.0, s_tech))

        # 4. Project evidence
        s_project = 1.0 if has_project_evidence else 0.0

        # 5. Solution evidence
        s_solution = 1.0 if has_solution_evidence else 0.0

        # 6. Research evidence
        s_research = 1.0 if has_research_evidence else 0.0

        # Person-centric Weighted Sum: 25% problem relevance, 20% skills, 15% tech, 15% projects, 15% solutions, 10% research
        final_score = (
            0.25 * s_semantic
            + 0.20 * s_skill
            + 0.15 * s_tech
            + 0.15 * s_project
            + 0.15 * s_solution
            + 0.10 * s_research
        )
        final_score = round(max(0.0, min(1.0, final_score)), 4)

        # Determine human readable relevance level
        relevance_level = self.get_relevance_level(final_score)

        # Determine evidence strength label
        s_ev_quality = EVIDENCE_QUALITY_HIERARCHY.get(best_evidence_type.upper(), 0.35)
        evidence_strength = self.get_evidence_strength(s_ev_quality, final_score)

        breakdown = {
            "semantic_relevance": s_semantic,
            "skill_overlap": s_skill,
            "technology_overlap": s_tech,
            "project_evidence": s_project,
            "solution_evidence": s_solution,
            "research_evidence": s_research,
            "final_score": final_score,
        }

        return final_score, relevance_level, evidence_strength, breakdown

    @staticmethod
    def get_relevance_level(score: float) -> str:
        """Map normalized score (0.0 to 1.0) to user-facing relevance text without fake precision."""
        if score >= 0.80:
            return "High relevance"
        elif score >= 0.65:
            return "Strong match"
        elif score >= 0.45:
            return "Relevant"
        else:
            return "Potential match"

    @staticmethod
    def get_evidence_strength(evidence_quality_score: float, final_score: float) -> str:
        """Classify evidence strength into standard label string."""
        combined = (evidence_quality_score + final_score) / 2.0
        if combined >= 0.65:
            return "Strong evidence"
        elif combined >= 0.45:
            return "Moderate evidence"
        else:
            return "Basic evidence"
