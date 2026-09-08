import logging
from typing import List, Optional, Tuple
from app.schemas.matching import EvidenceItem, HelpTypeEnum
from app.agents.prompts import MATCH_EXPLANATION_PROMPT_V1
from app.services.llm_provider import get_llm_provider

logger = logging.getLogger(__name__)


class ExplanationService:
    """
    Service responsible for converting structured candidate matching and evidence data
    into concise, human-readable, grounded explanations.
    Strictly prevents hallucination of unbacked skills or credentials.
    """

    def __init__(self):
        self.llm_provider = get_llm_provider()

    def generate_explanation(
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
        """
        Generates concise evidence-backed explanation, classifies help type, and identifies strengths/limitations.

        Returns:
            Tuple of (explanation_text, help_type, strengths, limitations)
        """
        candidate_type_upper = candidate_type.upper()
        
        # 1. Determine Help Type based on candidate entity type and matched skills
        help_type = self._classify_help_type(candidate_type_upper, matched_skills, matched_technologies)

        # 2. Extract strengths and limitations
        strengths = []
        if matched_skills:
            strengths.append(f"Matched skills: {', '.join(matched_skills[:3])}")
        if matched_technologies:
            strengths.append(f"Technology overlap: {', '.join(matched_technologies[:3])}")
        if evidence_items:
            strengths.append(f"Backed by {len(evidence_items)} campus evidence record(s)")

        limitations = []
        if not evidence_items:
            limitations.append("Limited direct project evidence recorded in system")

        # 3. Grounded deterministic text fallback
        explanation_text = self._build_deterministic_explanation(
            candidate_title,
            candidate_type_upper,
            relevance_level,
            matched_skills,
            matched_technologies,
            evidence_items,
        )

        # 4. If real LLM client is available and candidate is a high-relevance match with evidence, attempt concise summary generation
        if (
            hasattr(self.llm_provider, "_client")
            and self.llm_provider._client is not None
            and relevance_score >= 0.70
            and len(evidence_items) > 0
        ):
            try:
                evidence_snippets = "\n".join([f"- [{ev.source_type}] {ev.source_title}: {ev.snippet}" for ev in evidence_items[:3]])
                prompt = (
                    f"{MATCH_EXPLANATION_PROMPT_V1}\n\n"
                    f"USER PROBLEM: {query}\n"
                    f"CANDIDATE: {candidate_title} ({candidate_type_upper})\n"
                    f"MATCHED SKILLS: {', '.join(matched_skills) if matched_skills else 'None'}\n"
                    f"MATCHED TECH: {', '.join(matched_technologies) if matched_technologies else 'None'}\n"
                    f"EVIDENCE:\n{evidence_snippets if evidence_snippets else 'No direct evidence'}\n\n"
                    f"Provide a 1-2 sentence evidence-backed explanation summary."
                )
                res = self.llm_provider.generate_text(prompt)
                if res and len(res.strip()) > 10 and not res.strip().startswith("Mock response"):
                    explanation_text = res.strip()
            except Exception as exc:
                logger.warning(f"LLM explanation generation fallback: {exc}")

        return explanation_text, help_type, strengths, limitations

    def _build_deterministic_explanation(
        self,
        title: str,
        candidate_type: str,
        relevance_level: str,
        matched_skills: List[str],
        matched_technologies: List[str],
        evidence_items: List[EvidenceItem],
    ) -> str:
        """Constructs a deterministic, evidence-grounded explanation string."""
        if "match" in relevance_level.lower():
            relevance_prefix = relevance_level
        else:
            relevance_prefix = f"{relevance_level} match"
        
        parts = []
        if matched_skills:
            parts.append(f"expertise in {', '.join(matched_skills[:3])}")
        if matched_technologies:
            parts.append(f"hands-on experience with {', '.join(matched_technologies[:3])}")

        if evidence_items:
            best_ev = evidence_items[0]
            if candidate_type == "PERSON":
                if best_ev.source_type in ("PROJECT", "RESEARCH", "PROBLEM_SOLUTION") and best_ev.source_title not in ("Public Profile & Skills", title):
                    return f"{relevance_prefix} because they contributed to '{best_ev.source_title}' and have {' and '.join(parts) if parts else 'relevant background'}."
                else:
                    return f"{relevance_prefix} based on {' and '.join(parts) if parts else 'relevant profile background'}."
            elif candidate_type in ("PROJECT", "RESEARCH"):
                return f"{relevance_prefix} as a similar campus endeavor featuring {' and '.join(parts) if parts else 'matching technologies'}."
            elif candidate_type == "PROBLEM_SOLUTION":
                return f"{relevance_prefix} directly addressing a past campus issue via '{best_ev.source_title}'."
            elif candidate_type in ("FACILITY", "EQUIPMENT"):
                return f"{relevance_prefix} providing campus lab access and hardware capabilities for {', '.join(matched_technologies[:2]) if matched_technologies else 'testing'}."

        if parts:
            return f"{relevance_prefix} based on shared {' and '.join(parts)}."
        
        return f"{relevance_prefix} based on shared skills and technology."

    @staticmethod
    def _classify_help_type(
        candidate_type: str,
        matched_skills: List[str],
        matched_technologies: List[str]
    ) -> HelpTypeEnum:
        """Classifies actionable help type derived strictly from evidence and candidate type."""
        if candidate_type == "PROBLEM_SOLUTION":
            return HelpTypeEnum.PREVIOUS_SOLUTION_REFERENCE
        elif candidate_type in ("FACILITY", "EQUIPMENT"):
            return HelpTypeEnum.FACILITY_ACCESS
        elif candidate_type in ("PROJECT", "RESEARCH"):
            return HelpTypeEnum.RESEARCH_GUIDANCE
        elif candidate_type == "PERSON":
            skills_lower = [s.lower() for s in matched_skills]
            tech_lower = [t.lower() for t in matched_technologies]
            all_tokens = set(skills_lower + tech_lower)

            if any(k in all_tokens for k in ["debug", "troubleshoot", "fix", "testing", "calibration"]):
                return HelpTypeEnum.DEBUGGING_HELP
            elif any(k in all_tokens for k in ["esp32", "hardware", "arduino", "raspberry", "sensor", "oscilloscope"]):
                return HelpTypeEnum.HARDWARE_SUPPORT
            elif any(k in all_tokens for k in ["tinyml", "python", "tensorflow", "pytorch", "algorithm", "model"]):
                return HelpTypeEnum.SOFTWARE_SUPPORT
            elif any(k in all_tokens for k in ["research", "paper", "theory"]):
                return HelpTypeEnum.RESEARCH_GUIDANCE
            else:
                return HelpTypeEnum.TECHNICAL_GUIDANCE
        
        return HelpTypeEnum.DOMAIN_EXPERTISE
