import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture
def student_a_cookies():
    """Student A auth session."""
    email = f"student_a_{uuid.uuid4().hex[:8]}@campuslink.edu"
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!", "role": "STUDENT"},
    )
    assert reg.status_code == 201
    return reg.cookies


@pytest.fixture
def student_b_cookies():
    """Student B auth session."""
    email = f"student_b_{uuid.uuid4().hex[:8]}@campuslink.edu"
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!", "role": "STUDENT"},
    )
    assert reg.status_code == 201
    return reg.cookies


@pytest.fixture
def admin_cookies():
    """Admin auth session."""
    email = f"admin_{uuid.uuid4().hex[:8]}@campuslink.edu"
    password = "Password123!"
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "role": "STUDENT"},
    )
    assert reg.status_code == 201

    from app.db.session import sync_engine
    from app.models.users import User, UserRole
    from sqlalchemy.orm import Session

    with Session(sync_engine) as db:
        db.query(User).filter(User.email == email).update({"role": UserRole.ADMIN})
        db.commit()

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200
    return login_resp.cookies


# ============================================================
# SEMANTIC & HYBRID SEARCH TESTS
# ============================================================

def test_search_and_reindex_flow(student_a_cookies, admin_cookies):
    # 1. Student A creates a public project and public solution
    proj_resp = client.post(
        "/api/v1/projects",
        json={
            "title": "ESP32 TinyML Noise Suppression",
            "description": "Using MFCC preprocessing and TinyML to filter microphone noise on ESP32.",
            "domain": "Embedded AI",
            "project_type": "RESEARCH",
            "technologies": ["ESP32", "TinyML", "MFCC"],
            "visibility": "PUBLIC",
            "status": "IN_PROGRESS",
        },
        cookies=student_a_cookies,
    )
    assert proj_resp.status_code == 201
    proj_id = proj_resp.json()["id"]

    sol_resp = client.post(
        "/api/v1/solutions",
        json={
            "title": "Reducing Microphone Noise on ESP32",
            "problem": "Noisy microphone audio causing poor classification accuracy.",
            "solution": "Applied bandpass filter and MFCC spectral subtraction.",
            "domain": "Audio Signal Processing",
            "technologies": ["ESP32", "TinyML", "DSP"],
            "visibility": "PUBLIC",
            "status": "PUBLISHED",
        },
        cookies=student_a_cookies,
    )
    assert sol_resp.status_code == 201
    sol_id = sol_resp.json()["id"]

    # 2. Trigger Reindex as Admin
    reindex_resp = client.post("/api/v1/search/reindex", json={}, cookies=admin_cookies)
    assert reindex_resp.status_code == 200
    r_data = reindex_resp.json()
    assert r_data["status"] == "SUCCESS"
    assert r_data["total_records"] >= 2

    # 3. Execute hybrid search as Student A
    search_req = {
        "query": "ESP32 audio noise filtering TinyML",
        "mode": "HYBRID",
        "limit": 50,
    }
    search_resp = client.post("/api/v1/search", json=search_req, cookies=student_a_cookies)
    assert search_resp.status_code == 200
    res = search_resp.json()
    assert res["total"] >= 1
    returned_ids = [item["entity_id"] for item in res["results"]]
    assert proj_id in returned_ids or sol_id in returned_ids

    # Verify no raw vector or private key leaks
    for item in res["results"]:
        assert "embedding" not in item
        assert "vector" not in item
        assert "password" not in item
        assert "api_key" not in item


def test_visibility_and_privacy_enforcement(student_a_cookies, student_b_cookies, admin_cookies):
    # 1. Student A creates a PRIVATE project
    priv_proj = client.post(
        "/api/v1/projects",
        json={
            "title": "Top Secret Quantum Encryption Algorithm",
            "description": "Ultra confidential project details.",
            "visibility": "PRIVATE",
            "status": "IN_PROGRESS",
        },
        cookies=student_a_cookies,
    )
    assert priv_proj.status_code == 201
    priv_proj_id = priv_proj.json()["id"]

    # Reindex to register private project in search store
    reindex_resp = client.post("/api/v1/search/reindex", json={}, cookies=admin_cookies)
    assert reindex_resp.status_code == 200

    # 2. Student B searches for quantum encryption
    search_req = {
        "query": "Quantum Encryption Algorithm",
        "entity_types": ["PROJECT"],
        "mode": "HYBRID",
        "limit": 10,
    }
    search_b = client.post("/api/v1/search", json=search_req, cookies=student_b_cookies)
    assert search_b.status_code == 200
    b_ids = [item["entity_id"] for item in search_b.json()["results"]]
    assert priv_proj_id not in b_ids  # Private project must NOT appear to Student B

    # 3. Student A searches for their own private project
    search_a = client.post("/api/v1/search", json=search_req, cookies=student_a_cookies)
    assert search_a.status_code == 200
    a_ids = [item["entity_id"] for item in search_a.json()["results"]]
    assert priv_proj_id in a_ids  # Private project SHOULD appear to owner Student A


def test_unauthorized_reindex_rejected(student_a_cookies):
    # Non-admin attempting to reindex gets 403 Forbidden
    resp = client.post("/api/v1/search/reindex", cookies=student_a_cookies)
    assert resp.status_code == 403
