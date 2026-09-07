#!/usr/bin/env python3
"""
CampusLink AI — Real Gemini Provider Smoke Test Script.

Validates end-to-end connectivity, query understanding, explanation generation,
and explicit GeminiLLMProvider identity without exposing secrets.
"""

import sys
import os

# Ensure apps/api is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.services.llm_provider import get_llm_provider, GeminiLLMProvider
from app.agents.query_understanding import QueryUnderstandingAgent
from app.schemas.agents import QueryUnderstandingResult
from app.services.explanation_service import ExplanationService
from app.schemas.matching import EvidenceItem


def run_gemini_smoke_test() -> bool:
    print("\n=== CampusLink Gemini Smoke Test ===")

    # 1. Check LLM_PROVIDER
    provider_type = (settings.LLM_PROVIDER or "gemini").lower()
    print(f"Configured LLM_PROVIDER: {settings.LLM_PROVIDER}")

    if provider_type != "gemini":
        print(f"[FAIL] LLM_PROVIDER must be 'gemini' for this smoke test. Found: '{settings.LLM_PROVIDER}'")
        return False

    # 2. Check API Key
    key_configured = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here")
    print(f"API key configured: {'YES' if key_configured else 'NO'}")

    if not key_configured:
        print("[FAIL] GEMINI_API_KEY is not configured or set to placeholder.")
        return False

    # 3. Model
    print(f"Model: {settings.GEMINI_MODEL}")

    # 4. Resolve Provider and Verify Identity
    try:
        provider = get_llm_provider()
    except Exception as exc:
        print(f"[FAIL] Failed to resolve LLM provider: {exc}")
        return False

    print(f"Provider identity: {provider.__class__.__name__}")

    if not isinstance(provider, GeminiLLMProvider):
        print(f"[FAIL] Provider identity is NOT GeminiLLMProvider. Found: {type(provider).__name__}")
        return False

    # 5. Raw Text Connectivity Test
    print("Testing Gemini raw text generation...", flush=True)
    try:
        raw_text = provider.generate_text("Hello Gemini, reply with 'READY' only.")
        if raw_text and len(raw_text.strip()) > 0:
            print(f"[PASS] Text response: '{raw_text.strip()}'", flush=True)
        else:
            print("[FAIL] Empty text returned", flush=True)
            return False
    except Exception as exc:
        print(f"[FAIL] Error: {exc}", flush=True)
        return False

    # 6. Query Understanding Test with Golden Query
    golden_query = (
        "My ESP32 microphone is working, but my TinyML keyword detection model is giving poor accuracy. "
        "I don't know whether the problem is with the microphone, audio preprocessing, or the ML model."
    )
    print("\nTesting QueryUnderstandingAgent with Golden Query...", flush=True)
    try:
        agent = QueryUnderstandingAgent(provider=provider)
        query_result = agent.analyze(golden_query)
        if isinstance(query_result, QueryUnderstandingResult) and query_result.domain and query_result.skills:
            print("Query understanding: PASS")
            print(f"  - Extracted Domains: {query_result.domain}")
            print(f"  - Required Skills: {query_result.skills}")
            print(f"  - Technologies: {query_result.technologies}")
        else:
            print("Query understanding: FAIL (Invalid output schema)")
            return False
    except Exception as exc:
        print(f"Query understanding: FAIL ({exc})")
        return False

    # 7. Explanation Generation Test
    print("\nTesting ExplanationService with Gemini...", flush=True)
    try:
        expl_service = ExplanationService()
        expl_service.llm_provider = provider
        explanation, help_type, strengths, limitations = expl_service.generate_explanation(
            query=golden_query,
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
                    source_title="Edge ML Model Compression",
                    snippet="Developed TinyML audio model on ESP32"
                )
            ]
        )
        if explanation and len(explanation) > 10:
            print("Explanation generation: PASS", flush=True)
            print(f"  - Generated Explanation: \"{explanation}\"", flush=True)
        else:
            print("Explanation generation: FAIL (Empty explanation)", flush=True)
            return False
    except Exception as exc:
        print(f"Explanation generation: FAIL ({exc})", flush=True)
        return False

    print("\n=== REAL GEMINI PROVIDER VERIFIED ===\n")
    return True


if __name__ == "__main__":
    success = run_gemini_smoke_test()
    if not success:
        sys.exit(1)
    sys.exit(0)
