"""
============================================================
CAMPUSLINK AI — PHASE 10 TEST SUITE
TRUST, FEEDBACK & RECOMMENDATION QUALITY INTELLIGENCE
============================================================
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import sync_engine
from app.models.users import User, UserRole, UserStatus
from app.models.recommendation import RecommendationEvent
from app.models.feedback import RecommendationFeedback, FeedbackType
from app.repositories.recommendation_repository import RecommendationRepository
from app.services.recommendation_quality_service import RecommendationQualityService
from app.schemas.feedback import FeedbackType as SchemaFeedbackType, QualityFlagEnum

# ============================================================
# TEST FIXTURES & HELPERS
# ============================================================

@pytest.fixture
def student_context():
    """Register student via API and create a recommendation event owned by that student."""
    c = TestClient(app)
    email = f"student_{uuid.uuid4().hex[:8]}@campuslink.edu"
    reg = c.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!", "role": "STUDENT"},
    )
    assert reg.status_code == 201

    with Session(sync_engine) as db:
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        user_uuid = user.id

        event_id = uuid.uuid4()
        repo = RecommendationRepository(db)
        event = RecommendationEvent(
            id=event_id,
            request_id=f"req_{uuid.uuid4().hex[:8]}",
            user_id=user_uuid,
            query="Test ESP32 audio classification problem",
            entity_type="PROFILE",
            entity_id=uuid.uuid4(),
            rank_position=1,
            relevance_score=0.88,
            evidence_quality_score=0.85,
            explanation_generated="Matched based on extensive ESP32 firmware experience.",
        )
        repo.create_recommendation_events_sync([event])
        db.commit()

    return {
        "user_id": str(user_uuid),
        "email": email,
        "client": c,
        "event_id": str(event_id),
    }


@pytest.fixture
def other_student_context():
    """Register second student user for IDOR authorization testing."""
    c = TestClient(app)
    email = f"other_{uuid.uuid4().hex[:8]}@campuslink.edu"
    reg = c.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!", "role": "STUDENT"},
    )
    assert reg.status_code == 201

    with Session(sync_engine) as db:
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        user_id = str(user.id)

    return {"user_id": user_id, "email": email, "client": c}


@pytest.fixture
def admin_context():
    """Register administrator user via API."""
    c = TestClient(app)
    email = f"admin_{uuid.uuid4().hex[:8]}@campuslink.edu"
    password = "Password123!"
    reg = c.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "role": "STUDENT"},
    )
    assert reg.status_code == 201

    with Session(sync_engine) as db:
        db.query(User).filter(User.email == email).update({"role": UserRole.ADMIN})
        db.commit()

    login_resp = c.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200

    with Session(sync_engine) as db:
        user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        user_id = str(user.id)

    return {"user_id": user_id, "email": email, "client": c}


# ============================================================
# 1. MODEL & MIGRATION SCHEMA TESTS
# ============================================================

def test_recommendation_event_model_instantiation():
    event = RecommendationEvent(
        request_id="req_123",
        user_id=uuid.uuid4(),
        query="Test query",
        entity_type="PROFILE",
        entity_id=uuid.uuid4(),
        rank_position=1,
        relevance_score=0.92,
        evidence_quality_score=0.80,
    )
    assert event.request_id == "req_123"
    assert event.relevance_score == 0.92


def test_recommendation_feedback_model_instantiation():
    fb = RecommendationFeedback(
        recommendation_event_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        feedback_type=FeedbackType.HELPFUL,
        comment="Very helpful match!",
    )
    assert fb.feedback_type == FeedbackType.HELPFUL
    assert fb.comment == "Very helpful match!"


def test_feedback_type_enum_values():
    valid_types = {"HELPFUL", "NOT_HELPFUL", "PARTIALLY_HELPFUL", "WRONG_MATCH", "OUTDATED", "INSUFFICIENT_EVIDENCE"}
    for t in valid_types:
        assert FeedbackType[t].value == t
        assert SchemaFeedbackType[t].value == t


# ============================================================
# 2. FEEDBACK SUBMISSION & UP-DATABILITY TESTS
# ============================================================

def test_submit_feedback_success(student_context):
    tc = student_context["client"]
    event_id = student_context["event_id"]
    res = tc.post(
        f"/api/v1/feedback/recommendations/{event_id}",
        json={"feedback_type": "HELPFUL", "comment": "Great recommendation!"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["recommendation_event_id"] == event_id
    assert data["feedback_type"] == "HELPFUL"
    assert data["comment"] == "Great recommendation!"


def test_submit_feedback_updateable(student_context):
    tc = student_context["client"]
    event_id = student_context["event_id"]
    # Submit initial feedback
    res1 = tc.post(
        f"/api/v1/feedback/recommendations/{event_id}",
        json={"feedback_type": "HELPFUL", "comment": "Initial vote"},
    )
    assert res1.status_code == 200
    fb_id = res1.json()["id"]

    # Update feedback to WRONG_MATCH
    res2 = tc.post(
        f"/api/v1/feedback/recommendations/{event_id}",
        json={"feedback_type": "WRONG_MATCH", "comment": "Updated evaluation: domain mismatch"},
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["id"] == fb_id  # Same record ID updated
    assert data2["feedback_type"] == "WRONG_MATCH"
    assert data2["comment"] == "Updated evaluation: domain mismatch"


def test_get_feedback_success(student_context):
    tc = student_context["client"]
    event_id = student_context["event_id"]
    # Submit feedback first
    tc.post(
        f"/api/v1/feedback/recommendations/{event_id}",
        json={"feedback_type": "HELPFUL"},
    )

    # Fetch feedback
    res = tc.get(f"/api/v1/feedback/recommendations/{event_id}")
    assert res.status_code == 200
    assert res.json()["feedback_type"] == "HELPFUL"


# ============================================================
# 3. SECURITY & AUTHORIZATION (IDOR + ADMIN PROTECTION) TESTS
# ============================================================

def test_submit_feedback_unauthenticated_returns_401(student_context):
    unauth_client = TestClient(app)
    event_id = student_context["event_id"]
    res = unauth_client.post(
        f"/api/v1/feedback/recommendations/{event_id}",
        json={"feedback_type": "HELPFUL"},
    )
    assert res.status_code == 401


def test_submit_feedback_idor_protection_returns_403(other_student_context, student_context):
    """User B attempts to submit feedback on User A's recommendation event."""
    tc = other_student_context["client"]
    event_id = student_context["event_id"]
    res = tc.post(
        f"/api/v1/feedback/recommendations/{event_id}",
        json={"feedback_type": "NOT_HELPFUL"},
    )
    assert res.status_code == 403


def test_get_feedback_idor_protection_returns_403(other_student_context, student_context):
    """User B attempts to view User A's recommendation feedback."""
    tc = other_student_context["client"]
    event_id = student_context["event_id"]
    res = tc.get(f"/api/v1/feedback/recommendations/{event_id}")
    assert res.status_code == 403


def test_admin_metrics_endpoint_authorized(admin_context):
    tc = admin_context["client"]
    res = tc.get("/api/v1/admin/recommendations/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "total_recommendations" in data
    assert "helpful_rate" in data
    assert "by_entity_type" in data


def test_admin_metrics_endpoint_unauthorized_non_admin_returns_403(student_context):
    tc = student_context["client"]
    res = tc.get("/api/v1/admin/recommendations/metrics")
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]


def test_admin_list_recommendations_authorized(admin_context):
    tc = admin_context["client"]
    res = tc.get("/api/v1/admin/recommendations")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data


def test_admin_list_recommendations_unauthorized_non_admin_returns_403(student_context):
    tc = student_context["client"]
    res = tc.get("/api/v1/admin/recommendations")
    assert res.status_code == 403


def test_admin_recommendation_detail_authorized(admin_context, student_context):
    tc = admin_context["client"]
    event_id = student_context["event_id"]
    res = tc.get(f"/api/v1/admin/recommendations/{event_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == event_id
    assert data["query"] == "Test ESP32 audio classification problem"
    assert data["entity_type"] == "PROFILE"


def test_admin_recommendation_detail_unauthorized_non_admin_returns_403(student_context):
    tc = student_context["client"]
    event_id = student_context["event_id"]
    res = tc.get(f"/api/v1/admin/recommendations/{event_id}")
    assert res.status_code == 403


# ============================================================
# 4. DETERMINISTIC QUALITY FLAGS TESTS
# ============================================================

def test_quality_flags_low_evidence(student_context):
    with Session(sync_engine) as db:
        svc = RecommendationQualityService(db)
        event = RecommendationEvent(
            request_id="req_low_ev",
            user_id=uuid.UUID(student_context["user_id"]),
            query="Test low evidence flag",
            entity_type="PROJECT",
            entity_id=uuid.uuid4(),
            rank_position=1,
            relevance_score=0.8,
            evidence_quality_score=0.5,  # < 0.70 -> LOW_EVIDENCE
            explanation_generated="Some explanation",
        )
        flags = svc.evaluate_quality_flags(event, None)
        assert QualityFlagEnum.LOW_EVIDENCE in flags


def test_quality_flags_low_semantic_relevance(student_context):
    with Session(sync_engine) as db:
        svc = RecommendationQualityService(db)
        event = RecommendationEvent(
            request_id="req_low_rel",
            user_id=uuid.UUID(student_context["user_id"]),
            query="Test low relevance flag",
            entity_type="RESEARCH",
            entity_id=uuid.uuid4(),
            rank_position=1,
            relevance_score=0.45,  # < 0.60 -> LOW_SEMANTIC_RELEVANCE
            evidence_quality_score=0.8,
            explanation_generated="Some explanation",
        )
        flags = svc.evaluate_quality_flags(event, None)
        assert QualityFlagEnum.LOW_SEMANTIC_RELEVANCE in flags


def test_quality_flags_negative_user_feedback(student_context):
    with Session(sync_engine) as db:
        svc = RecommendationQualityService(db)
        event = RecommendationEvent(
            id=uuid.uuid4(),
            request_id="req_neg_fb",
            user_id=uuid.UUID(student_context["user_id"]),
            query="Test negative feedback flag",
            entity_type="PROFILE",
            entity_id=uuid.uuid4(),
            rank_position=1,
            relevance_score=0.9,
            evidence_quality_score=0.9,
            explanation_generated="Great explanation",
        )
        fb = RecommendationFeedback(
            recommendation_event_id=event.id,
            user_id=uuid.UUID(student_context["user_id"]),
            feedback_type=FeedbackType.WRONG_MATCH,
        )
        flags = svc.evaluate_quality_flags(event, fb)
        assert QualityFlagEnum.NEGATIVE_USER_FEEDBACK in flags


def test_quality_flags_explanation_missing(student_context):
    with Session(sync_engine) as db:
        svc = RecommendationQualityService(db)
        event = RecommendationEvent(
            request_id="req_no_exp",
            user_id=uuid.UUID(student_context["user_id"]),
            query="Test explanation missing flag",
            entity_type="FACILITY",
            entity_id=uuid.uuid4(),
            rank_position=1,
            relevance_score=0.8,
            evidence_quality_score=0.8,
            explanation_generated=None,
        )
        flags = svc.evaluate_quality_flags(event, None)
        assert QualityFlagEnum.EXPLANATION_MISSING in flags


# ============================================================
# 5. PRIVACY COMPLIANCE TESTS
# ============================================================

def test_privacy_rules_no_raw_resumes_stored():
    event = RecommendationEvent(
        request_id="req_priv",
        user_id=uuid.uuid4(),
        query="Test query",
        entity_type="PROFILE",
        entity_id=uuid.uuid4(),
        rank_position=1,
        relevance_score=0.88,
        evidence_quality_score=0.85,
    )
    event_dict = event.__dict__
    assert "raw_resume" not in event_dict
    assert "resume_text" not in event_dict
    assert "full_cv" not in event_dict


def test_privacy_rules_no_full_prompts_in_events():
    event = RecommendationEvent(
        request_id="req_priv",
        user_id=uuid.uuid4(),
        query="Test query",
        entity_type="PROFILE",
        entity_id=uuid.uuid4(),
        rank_position=1,
        relevance_score=0.88,
        evidence_quality_score=0.85,
    )
    assert hasattr(event, "query")
    assert not hasattr(event, "raw_system_prompt")


def test_privacy_rules_sanitized_candidate_titles():
    event = RecommendationEvent(
        request_id="req_priv",
        user_id=uuid.uuid4(),
        query="Test query",
        entity_type="PROFILE",
        entity_id=uuid.uuid4(),
        rank_position=1,
        relevance_score=0.88,
        evidence_quality_score=0.85,
    )
    assert "phone_number" not in event.__table__.columns
    assert "password_hash" not in event.__table__.columns


# ============================================================
# 6. REPOSITORY & SEARCH FILTERING TESTS
# ============================================================

def test_filter_recommendations_by_entity_type(admin_context, student_context):
    tc = admin_context["client"]
    res = tc.get("/api/v1/admin/recommendations?entity_type=PROFILE")
    assert res.status_code == 200
    items = res.json()["items"]
    assert all(item["entity_type"] == "PROFILE" for item in items)


def test_invalid_recommendation_id_returns_404(student_context):
    tc = student_context["client"]
    fake_id = str(uuid.uuid4())
    res = tc.post(
        f"/api/v1/feedback/recommendations/{fake_id}",
        json={"feedback_type": "HELPFUL"},
    )
    assert res.status_code == 404


def test_admin_detail_not_found_returns_404(admin_context):
    tc = admin_context["client"]
    fake_id = str(uuid.uuid4())
    res = tc.get(f"/api/v1/admin/recommendations/{fake_id}")
    assert res.status_code == 404
