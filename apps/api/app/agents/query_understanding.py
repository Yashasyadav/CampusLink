import logging
from typing import Optional
from app.services.llm_provider import get_llm_provider, LLMProvider
from app.schemas.agents import QueryUnderstandingResult, IntentEnum
from app.agents.prompts import QUERY_UNDERSTANDING_PROMPT_V1

logger = logging.getLogger(__name__)


class QueryUnderstandingAgent:
    """Agent responsible for analyzing natural language requests into structured intent."""

    def __init__(self, provider: Optional[LLMProvider] = None):
        self.provider = provider or get_llm_provider()

    def analyze(self, query: str) -> QueryUnderstandingResult:
        """Parse natural language query into strongly-typed QueryUnderstandingResult."""
        if not query or not query.strip():
            return QueryUnderstandingResult(
                original_query=query,
                intent=IntentEnum.GENERAL_CAMPUS_DISCOVERY,
            )

        prompt = (
            f"{QUERY_UNDERSTANDING_PROMPT_V1}\n\n"
            f"User Query:\n{query.strip()}\n\n"
            f"Extract structured domain, skills, technologies, problem_keywords, intent, and resource needs."
        )

        try:
            result = self.provider.generate_structured(prompt, QueryUnderstandingResult)
            result.original_query = query.strip()

            # Post-process: Filter ungrounded domains
            q_lower = query.lower()
            filtered_domains = []
            for d in result.domain:
                d_lower = d.lower()
                if "security" in d_lower or "cyber" in d_lower or "crypto" in d_lower:
                    if any(k in q_lower for k in ["security", "cyber", "attack", "vulnerability", "encryption", "auth", "hack", "threat"]):
                        filtered_domains.append(d)
                else:
                    filtered_domains.append(d)

            result.domain = filtered_domains
            if not result.problem_summary:
                result.problem_summary = query.strip()[:150]
            if not result.diagnostic_areas:
                result.diagnostic_areas = [t for t in (result.technologies + result.skills)[:3]] or ["Technical Guidance"]
            if result.resource_needs is None:
                result.resource_needs = []

            return result
        except Exception as exc:
            logger.error(f"Query understanding parsing failed: {exc}")
            # Heuristic fallback if LLM request fails (e.g. rate limit or network issue)
            q_lower = query.lower()
            fallback_domains = []
            fallback_skills = []
            fallback_tech = []
            if "esp32" in q_lower:
                fallback_tech.append("ESP32")
                fallback_domains.append("Embedded Systems")
            if "tinyml" in q_lower or "machine learning" in q_lower:
                fallback_skills.append("TinyML")
                fallback_domains.append("Machine Learning")
            if "audio" in q_lower or "microphone" in q_lower:
                fallback_domains.append("Audio Processing")
            if "android" in q_lower:
                fallback_skills.append("Android")
                fallback_domains.append("Mobile Development")
            if "firebase" in q_lower:
                fallback_skills.append("Firebase")
            if "vlsi" in q_lower:
                fallback_domains.append("Electronics")

            # Infer fallback intent and resources
            fallback_intent = IntentEnum.GENERAL_CAMPUS_DISCOVERY
            fallback_resources = []
            if "lab" in q_lower or "equipment" in q_lower or "facility" in q_lower or "testing" in q_lower:
                fallback_intent = IntentEnum.FIND_FACILITY
                if "vlsi" in q_lower or "circuit" in q_lower:
                    fallback_resources = ["VLSI Circuit Testing Equipment"]
            elif "project" in q_lower or "built" in q_lower:
                fallback_intent = IntentEnum.FIND_PROJECT
            elif "research" in q_lower or "paper" in q_lower:
                fallback_intent = IntentEnum.FIND_RESEARCH
            elif "solved" in q_lower or "solution" in q_lower:
                fallback_intent = IntentEnum.FIND_SIMILAR_SOLUTION
            elif any(w in q_lower for w in ["working, but", "poor accuracy", "issue", "bug", "troubleshoot", "error"]):
                fallback_intent = IntentEnum.FIND_EXPERTISE_AND_SIMILAR_SOLUTIONS
            elif "who" in q_lower or "knows" in q_lower or "expert" in q_lower:
                fallback_intent = IntentEnum.FIND_PERSON

            return QueryUnderstandingResult(
                original_query=query.strip(),
                problem_summary=query.strip()[:150],
                domain=fallback_domains,
                skills=fallback_skills,
                technologies=fallback_tech,
                diagnostic_areas=["Technical Investigation"],
                resource_needs=fallback_resources,
                intent=fallback_intent,
                needs_people=True,
                needs_projects=True,
                needs_solutions=True,
                needs_facilities=True,
            )
