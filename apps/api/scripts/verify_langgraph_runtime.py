#!/usr/bin/env python3
"""
CampusLink AI — Phase 9.2 LangGraph End-to-End Runtime Verification Script.

Proves that POST /api/v1/agents/discover executes through the compiled LangGraph
stateful graph workflow and uses the live GeminiLLMProvider (gemini-3.6-flash).
"""

import sys
import os
import uuid
import asyncio
from httpx import AsyncClient, ASGITransport

# Ensure apps/api is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.config import settings
from app.db.session import SyncSessionLocal
from app.models import User, Profile


async def verify_langgraph_async() -> bool:
    print("\n=== CampusLink AI Phase 9.2 LangGraph End-to-End Verification ===")
    print(f"Configured LLM_PROVIDER: {settings.LLM_PROVIDER}")
    print(f"Configured GEMINI_MODEL: {settings.GEMINI_MODEL}")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Authenticate Test User
        email = f"verify_langgraph_{uuid.uuid4().hex[:8]}@campuslink.edu"
        print(f"1. Authenticating test user ({email})...", flush=True)
        reg_resp = await ac.post(
            "/api/v1/auth/register",
            json={"email": email, "password": "Password123!", "role": "STUDENT"},
        )
        if reg_resp.status_code != 201:
            print(f"[FAIL] Registration failed: {reg_resp.text}")
            return False

        # Set profile as completed and searchable
        with SyncSessionLocal() as db:
            u = db.query(User).filter(User.email == email).first()
            if u and u.profile:
                u.profile.searchable = True
                u.profile.profile_completed = True
                db.commit()

        # 2. Prepare Golden Query
        golden_query = (
            "My ESP32 microphone is working, but my TinyML keyword detection model is giving poor accuracy. "
            "I don't know whether the problem is with the microphone, audio preprocessing, or the ML model."
        )
        print(f"\n2. Sending Golden Query via HTTP POST /api/v1/agents/discover...\n   \"{golden_query[:90]}...\"", flush=True)

        # 3. Call API Endpoint
        resp = await ac.post(
            "/api/v1/agents/discover",
            json={"query": golden_query},
        )

        if resp.status_code != 200:
            print(f"[FAIL] Endpoint returned HTTP {resp.status_code}: {resp.text}")
            return False

        data = resp.json()
        print("   HTTP 200 OK Received!", flush=True)

        # 4. Verify LangGraph Execution Traces
        print("\n3. Verifying LangGraph Node Execution Traces...", flush=True)
        traces = data.get("traces", [])
        executed_nodes = [t["agent_name"] for t in traces]

        expected_nodes = [
            "InitializeRequestNode",
            "QueryUnderstandingAgent",
            "PeopleDiscoveryAgent",
            "ProjectKnowledgeDiscoveryAgent",
            "FacilityDiscoveryAgent",
            "EvidenceAggregatorNode",
            "MatchingEngineNode",
            "ExplanationEngineNode",
            "ValidationNode",
            "WorkflowFinalizerNode",
        ]

        all_nodes_passed = True
        for idx, expected_node in enumerate(expected_nodes, start=1):
            if expected_node in executed_nodes:
                print(f"   [{idx}/10] Node '{expected_node}': EXECUTED")
            else:
                print(f"   [{idx}/10] Node '{expected_node}': MISSING!")
                all_nodes_passed = False

        if not all_nodes_passed:
            print("[FAIL] One or more expected LangGraph nodes were not executed!")
            return False

        # 5. Verify Gemini Provider Identity in Graph Traces
        print("\n4. Verifying Provider & Model Metadata in LangGraph State...", flush=True)
        qu_trace = next((t for t in traces if t["agent_name"] == "QueryUnderstandingAgent"), {})
        expl_trace = next((t for t in traces if t["agent_name"] == "ExplanationEngineNode"), {})

        provider_qu = qu_trace.get("provider")
        model_qu = qu_trace.get("model")
        provider_expl = expl_trace.get("provider")
        model_expl = expl_trace.get("model")

        print(f"   QueryUnderstanding Provider: {provider_qu}")
        print(f"   QueryUnderstanding Model:    {model_qu}")
        print(f"   ExplanationEngine Provider:  {provider_expl}")
        print(f"   ExplanationEngine Model:    {model_expl}")

        if provider_qu != "GeminiLLMProvider" or provider_expl != "GeminiLLMProvider":
            print(f"[FAIL] Provider identity is NOT GeminiLLMProvider! (Found QU: {provider_qu}, Expl: {provider_expl})")
            return False

        if model_qu != settings.GEMINI_MODEL or model_expl != settings.GEMINI_MODEL:
            print(f"[FAIL] Model identity is NOT {settings.GEMINI_MODEL}! (Found QU: {model_qu}, Expl: {model_expl})")
            return False

        # 6. Verify Discovery & Match Content
        print("\n5. Verifying Discovery & Match Payload...", flush=True)
        qu_res = data.get("query_understanding", {})
        people_cands = data.get("people", {}).get("candidates", [])
        
        print(f"   Query Domains:     {qu_res.get('domain')}")
        print(f"   Required Skills:   {qu_res.get('skills')}")
        print(f"   Technologies:      {qu_res.get('technologies')}")
        print(f"   Discovered People: {len(people_cands)} candidates")

        if people_cands:
            first_person = people_cands[0]
            print(f"\n   Top Candidate Match:")
            print(f"     Name:        {first_person.get('display_name')}")
            print(f"     Skills:      {first_person.get('matched_skills')}")

        print("\n=== LANGGRAPH END-TO-END RUNTIME VERIFIED ===\n")
        return True


def run_runtime_verification() -> bool:
    return asyncio.run(verify_langgraph_async())


if __name__ == "__main__":
    success = run_runtime_verification()
    if not success:
        sys.exit(1)
    sys.exit(0)
