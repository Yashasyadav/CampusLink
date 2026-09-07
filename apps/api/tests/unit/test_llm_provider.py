import pytest
from unittest.mock import MagicMock, patch

from app.core.config import settings
from app.services.llm_provider import (
    LLMProvider,
    GeminiLLMProvider,
    FakeLLMProvider,
    GeminiProviderError,
    get_llm_provider,
)
from app.agents.query_understanding import QueryUnderstandingAgent
from app.schemas.agents import QueryUnderstandingResult
from app.services.explanation_service import ExplanationService
from app.schemas.matching import EvidenceItem


def test_fake_provider_selection(monkeypatch):
    """Test A: LLM_PROVIDER=fake selects FakeLLMProvider."""
    monkeypatch.setattr(settings, "LLM_PROVIDER", "fake")
    provider = get_llm_provider()
    assert isinstance(provider, FakeLLMProvider)
    assert provider.model_name == settings.GEMINI_MODEL


def test_gemini_provider_selection(monkeypatch):
    """Test B: LLM_PROVIDER=gemini selects GeminiLLMProvider when configured."""
    monkeypatch.setattr(settings, "LLM_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "valid_mock_key")
    with patch("google.genai.Client") as mock_client:
        provider = get_llm_provider()
        assert isinstance(provider, GeminiLLMProvider)
        assert provider.model_name == settings.GEMINI_MODEL


def test_missing_gemini_api_key_raises_error(monkeypatch):
    """Test C: LLM_PROVIDER=gemini with missing/placeholder key raises GeminiProviderError."""
    monkeypatch.setattr(settings, "LLM_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "your_gemini_api_key_here")
    
    with pytest.raises(GeminiProviderError) as exc_info:
        get_llm_provider()
    assert "GEMINI_API_KEY is missing or unconfigured" in str(exc_info.value)


def test_unknown_provider_raises_error(monkeypatch):
    """Test D: Unknown LLM_PROVIDER value raises clear ValueError."""
    monkeypatch.setattr(settings, "LLM_PROVIDER", "invalid_provider_name")
    
    with pytest.raises(ValueError) as exc_info:
        get_llm_provider()
    assert "Unsupported or unknown LLM_PROVIDER" in str(exc_info.value)


def test_gemini_api_failure_raises_gemini_provider_error(monkeypatch):
    """Test E: Gemini API failure raises GeminiProviderError and DOES NOT silently fall back to FakeLLMProvider."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "valid_mock_key")
    
    with patch("google.genai.Client") as mock_client_cls:
        mock_client_instance = MagicMock()
        mock_client_instance.models.generate_content.side_effect = Exception("API rate limit or 404 error")
        mock_client_cls.return_value = mock_client_instance

        provider = GeminiLLMProvider(api_key="valid_mock_key")
        
        with pytest.raises(GeminiProviderError) as exc_info:
            provider.generate_text("Test prompt")
        
        assert "Gemini API request failed" in str(exc_info.value)

        with pytest.raises(GeminiProviderError) as exc_info_struct:
            provider.generate_structured("Test prompt", QueryUnderstandingResult)
        
        assert "Structured output generation/parsing failed" in str(exc_info_struct.value)


def test_query_understanding_agent_with_fake_provider():
    """Test F: QueryUnderstandingAgent works cleanly with FakeLLMProvider."""
    fake_provider = FakeLLMProvider()
    agent = QueryUnderstandingAgent(provider=fake_provider)
    result = agent.analyze("My ESP32 microphone has low accuracy")
    
    assert isinstance(result, QueryUnderstandingResult)
    assert "Embedded Systems" in result.domain or "TinyML" in result.domain
    assert "ESP32" in result.technologies


def test_explanation_service_with_fake_provider():
    """Test G: ExplanationService works cleanly with FakeLLMProvider."""
    expl_service = ExplanationService()
    expl_service.llm_provider = FakeLLMProvider()
    
    explanation, help_type, strengths, limitations = expl_service.generate_explanation(
        query="ESP32 audio noise",
        candidate_title="Diya Sharma",
        candidate_type="PERSON",
        relevance_score=0.55,
        relevance_level="Medium",
        matched_skills=["TinyML"],
        matched_technologies=["ESP32"],
        evidence_items=[
            EvidenceItem(
                source_type="PROJECT",
                source_id="proj_1",
                source_title="Edge ML Compression",
                snippet="Developed TinyML audio model"
            )
        ]
    )
    
    assert explanation is not None
    assert len(explanation) > 0
    assert help_type is not None
