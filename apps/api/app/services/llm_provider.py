import abc
import json
import logging
from typing import Optional, Type, TypeVar, Any
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class LLMProvider(abc.ABC):
    """Abstract Base Class for LLM providers."""

    @property
    @abc.abstractmethod
    def model_name(self) -> str:
        """Name of the LLM model."""
        pass

    @abc.abstractmethod
    def generate_text(self, prompt: str) -> str:
        """Generate unstructured text response."""
        pass

    @abc.abstractmethod
    def generate_structured(self, prompt: str, response_schema: Type[T]) -> T:
        """Generate response strictly conforming to a Pydantic schema."""
        pass


class GeminiLLMProvider(LLMProvider):
    """Concrete LLM provider using Google GenAI SDK."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._api_key = api_key or settings.GEMINI_API_KEY
        self._model = model or settings.GEMINI_MODEL or "gemini-1.5-pro"
        self._client = None

        if self._api_key and self._api_key != "your_gemini_api_key_here":
            try:
                from google import genai
                self._client = genai.Client(api_key=self._api_key)
            except Exception as exc:
                logger.warning(f"Failed to initialize GenAI LLM client: {exc}")

    @property
    def model_name(self) -> str:
        return self._model

    def generate_text(self, prompt: str) -> str:
        if self._client is None:
            logger.warning("Gemini LLM client uninitialized. Falling back to FakeLLMProvider.")
            return FakeLLMProvider(model=self._model).generate_text(prompt)

        try:
            response = self._client.models.generate_content(
                model=self._model,
                contents=prompt,
            )
            return response.text if hasattr(response, "text") and response.text else ""
        except Exception as exc:
            logger.error(f"Error calling Gemini generate_content: {exc}")
            return FakeLLMProvider(model=self._model).generate_text(prompt)

    def generate_structured(self, prompt: str, response_schema: Type[T]) -> T:
        if self._client is None:
            return FakeLLMProvider(model=self._model).generate_structured(prompt, response_schema)

        try:
            # Instruct model to produce raw JSON matching schema
            schema_json = json.dumps(response_schema.model_json_schema(), indent=2)
            structured_prompt = (
                f"{prompt}\n\n"
                f"CRITICAL REQUIREMENT: Return ONLY a valid JSON object matching this JSON Schema. "
                f"Do NOT include markdown formatting or extra commentary.\n"
                f"JSON Schema:\n{schema_json}"
            )
            raw_text = self.generate_text(structured_prompt)
            clean_text = raw_text.strip()

            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]

            data = json.loads(clean_text.strip())
            return response_schema.model_validate(data)
        except Exception as exc:
            logger.error(f"Structured output parsing failed: {exc}. Falling back to FakeLLMProvider.")
            return FakeLLMProvider(model=self._model).generate_structured(prompt, response_schema)


class FakeLLMProvider(LLMProvider):
    """Deterministic mock LLM provider for fast offline testing and fallback."""

    def __init__(self, model: str = "gemini-1.5-pro"):
        self._model = model

    @property
    def model_name(self) -> str:
        return self._model

    def generate_text(self, prompt: str) -> str:
        return f"Mock response for prompt: {prompt[:100]}"

    def generate_structured(self, prompt: str, response_schema: Type[T]) -> T:
        """Construct deterministic valid mock instance of target response_schema."""
        from app.schemas.agents import (
            QueryUnderstandingResult,
            IntentEnum,
            PeopleDiscoveryResult,
            ProjectKnowledgeResult,
            FacilityDiscoveryResult,
        )

        p_lower = prompt.lower()

        if response_schema == QueryUnderstandingResult:
            domains = []
            if "esp32" in p_lower or "embedded" in p_lower or "tinyml" in p_lower:
                domains.extend(["Embedded Systems", "TinyML"])
            if "audio" in p_lower or "microphone" in p_lower or "noise" in p_lower:
                domains.append("Audio Processing")
            if "cyber" in p_lower or "security" in p_lower or "network" in p_lower:
                domains.append("Cybersecurity")
            if "vision" in p_lower or "camera" in p_lower:
                domains.append("Computer Vision")
            if not domains:
                domains = ["Computer Science"]

            skills = []
            if "tinyml" in p_lower:
                skills.append("TinyML")
            if "audio" in p_lower:
                skills.append("Audio Processing")
            if "python" in p_lower:
                skills.append("Python")

            techs = []
            if "esp32" in p_lower:
                techs.append("ESP32")
            if "fastapi" in p_lower:
                techs.append("FastAPI")
            if "postgresql" in p_lower or "postgres" in p_lower:
                techs.append("PostgreSQL")

            return QueryUnderstandingResult(
                original_query=prompt[:200],
                domain=domains,
                skills=skills or ["Embedded Systems"],
                technologies=techs or ["ESP32"],
                problem_keywords=["accuracy", "noise", "hardware"],
                intent=IntentEnum.FIND_EXPERTISE_AND_SIMILAR_SOLUTIONS,
                needs_people=True,
                needs_projects=True,
                needs_solutions=True,
                needs_facilities="lab" in p_lower or "equipment" in p_lower or "debug" in p_lower,
            )

        elif response_schema == PeopleDiscoveryResult:
            return PeopleDiscoveryResult(
                candidates=[],
                status="SUCCESS",
                summary="Executed mock people discovery."
            )

        elif response_schema == ProjectKnowledgeResult:
            return ProjectKnowledgeResult(
                projects=[],
                research=[],
                solutions=[],
                evidence=[],
                status="SUCCESS"
            )

        elif response_schema == FacilityDiscoveryResult:
            return FacilityDiscoveryResult(
                facilities=[],
                equipment=[],
                evidence=[],
                status="SUCCESS"
            )

        # Generic fallback using Pydantic defaults or construct dummy dict
        try:
            return response_schema.model_validate({})
        except Exception:
            # Try to build minimal construct
            dummy_data = {}
            for fname, field in response_schema.model_fields.items():
                if field.is_required():
                    if field.annotation == str:
                        dummy_data[fname] = "mock_val"
                    elif field.annotation == int:
                        dummy_data[fname] = 0
                    elif field.annotation == float:
                        dummy_data[fname] = 0.0
                    elif field.annotation == bool:
                        dummy_data[fname] = False
                    elif getattr(field.annotation, "__origin__", None) == list:
                        dummy_data[fname] = []
                    elif hasattr(field.annotation, "__members__"):
                        dummy_data[fname] = list(field.annotation.__members__.values())[0]
            return response_schema.model_validate(dummy_data)


def get_llm_provider() -> LLMProvider:
    """Factory method to resolve configured LLM provider."""
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
        logger.info("No active GEMINI_API_KEY found, using FakeLLMProvider.")
        return FakeLLMProvider(model=settings.GEMINI_MODEL)

    return GeminiLLMProvider(api_key=settings.GEMINI_API_KEY, model=settings.GEMINI_MODEL)
