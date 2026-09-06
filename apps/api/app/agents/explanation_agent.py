import logging
from typing import List, Optional, Tuple
from app.schemas.matching import EvidenceItem, HelpTypeEnum
from app.services.explanation_service import ExplanationService

logger = logging.getLogger(__name__)


class ExplanationAgent:
    """
    Phase 8 Agent wrapper for evidence-grounded explanation generation.
    Enforces strict hallucination guardrails and prompt safety rules.
    """

    def __init__(self):
        self.service = ExplanationService()

    def explain(
        self,
        query: str,
        candidate_title: str,
        candidate_type: str,
        relevance_score: float,
        relevance_level: str,
        matched_skills: List[str],
        matched_technologies: List[str],
        evidence_items: List[EvidenceItem],
    ) -> Tuple[str, Optional[HelpTypeEnum], List[str], List[str]]:
        """Generates evidence-backed human-readable explanation and help classification."""
        return self.service.generate_explanation(
            query=query,
            candidate_title=candidate_title,
            candidate_type=candidate_type,
            relevance_score=relevance_score,
            relevance_level=relevance_level,
            matched_skills=matched_skills,
            matched_technologies=matched_technologies,
            evidence_items=evidence_items,
        )
