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
