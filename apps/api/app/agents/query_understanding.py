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
            return result
        except Exception as exc:
            logger.error(f"Query understanding parsing failed: {exc}")
            # Fallback
            return QueryUnderstandingResult(
                original_query=query.strip(),
                intent=IntentEnum.GENERAL_CAMPUS_DISCOVERY,
                needs_people=True,
                needs_projects=True,
                needs_solutions=True,
                needs_facilities=True,
            )
