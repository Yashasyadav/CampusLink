import pytest
import uuid
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import AsyncSessionLocal, sync_engine
from app.models.users import User, UserRole, UserStatus
from app.models.captcha import Captcha, CaptchaChallenge, CaptchaRotationState
from app.core.security import verify_password
from sqlalchemy import select
from sqlalchemy.orm import Session

client = TestClient(app)


def captcha_answer(challenge_token: str) -> str:
    with Session(sync_engine) as db:
        challenge = db.execute(
            select(CaptchaChallenge)
            .where(CaptchaChallenge.challenge_token == challenge_token)
        ).scalar_one()
        captcha = db.get(Captcha, challenge.captcha_id)
        return captcha.captcha_text


def captcha_login_payload(email: str, password: str, captcha_value: str | None = None) -> dict:
    response = client.get("/api/v1/auth/captcha")
    assert response.status_code == 200
    captcha = response.json()["captcha"]
    return {
        "email": email,
        "password": password,
        "captchaToken": captcha["challengeToken"],
        "captchaValue": captcha_value or captcha_answer(captcha["challengeToken"]),
    }


def test_registration_success():
    """Verify student registration succeeds and returns safe user data with cookies."""
    email = f"student.{uuid.uuid4().hex[:8]}@campuslink.edu"
    payload = {
        "email": email,
        "password": "SecurePassword123!",
        "role": "STUDENT",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == email.lower()
    assert data["user"]["role"] == "STUDENT"
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]

    # Verify HttpOnly auth cookie presence
    cookies = response.cookies
    assert "campuslink_access_token" in cookies


def test_registration_duplicate_email_rejected():
    """Verify duplicate email registration returns 409 Conflict."""
    email = f"dup.{uuid.uuid4().hex[:8]}@campuslink.edu"
    payload = {
        "email": email,
        "password": "SecurePassword123!",
        "role": "FACULTY",
    }
    resp1 = client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 201

    resp2 = client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == 409
    assert resp2.json()["detail"] == "An account with this email address already exists."


def test_registration_admin_role_restricted():
    """Verify clients cannot self-register as ADMIN."""
    payload = {
        "email": f"hacker.{uuid.uuid4().hex[:8]}@campuslink.edu",
        "password": "SecurePassword123!",
        "role": "ADMIN",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_registration_short_password_rejected():
    """Verify registration rejects passwords shorter than 8 characters."""
    payload = {
        "email": f"shortpass.{uuid.uuid4().hex[:8]}@campuslink.edu",
        "password": "short",
        "role": "STUDENT",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success_and_logout():
    """Verify login with correct credentials and subsequent logout."""
    email = f"login.user.{uuid.uuid4().hex[:8]}@campuslink.edu"
    password = "MyStrongPassword123!"

    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "role": "ALUMNI"},
    )
    assert reg_resp.status_code == 201

    # Test Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json=captcha_login_payload(email, password),
    )
    assert login_resp.status_code == 200
    assert login_resp.json()["user"]["email"] == email.lower()
    assert "campuslink_access_token" in login_resp.cookies

    # Test /me endpoint using cookies
    me_resp = client.get("/api/v1/auth/me", cookies=login_resp.cookies)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == email.lower()

    # Test Logout
    logout_resp = client.post("/api/v1/auth/logout", cookies=login_resp.cookies)
    assert logout_resp.status_code == 200

    # Verify unauthenticated /me after logout
    unauth_me = client.get("/api/v1/auth/me", cookies=logout_resp.cookies)
    assert unauth_me.status_code == 401


def test_login_invalid_password_fails():
    """Verify login fails with wrong password."""
    email = f"wrongpass.{uuid.uuid4().hex[:8]}@campuslink.edu"
    password = "CorrectPassword123!"

    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "role": "STUDENT"},
    )

    login_resp = client.post(
        "/api/v1/auth/login",
        json=captcha_login_payload(email, "WrongPassword123!"),
    )
    assert login_resp.status_code == 401
    assert login_resp.json()["message"] == "Invalid email or password."
    assert login_resp.json()["error"] == "authentication_failed"
    assert "nextCaptcha" in login_resp.json()


def test_captcha_fetch_returns_one_time_challenge():
    response = client.get("/api/v1/auth/captcha")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["captcha"]["challengeToken"]
    assert data["captcha"]["image"].startswith("data:image/svg+xml;base64,")


def test_captcha_rotates_and_wraps():
    with Session(sync_engine) as db:
        state = db.get(CaptchaRotationState, 1)
        if not state:
            state = CaptchaRotationState(id=1, current_index=0, updated_at=datetime.now(timezone.utc))
            db.add(state)
        state.current_index = 8
        db.commit()

    captcha_9 = client.get("/api/v1/auth/captcha").json()["captcha"]
    captcha_10 = client.get("/api/v1/auth/captcha").json()["captcha"]
    captcha_1 = client.get("/api/v1/auth/captcha").json()["captcha"]

    assert captcha_answer(captcha_9["challengeToken"]) == "P6A4Z"
    assert captcha_answer(captcha_10["challengeToken"]) == "R7M2Q"
    assert captcha_answer(captcha_1["challengeToken"]) == "K7P4X"


def test_wrong_captcha_blocks_login_and_returns_next_captcha():
    email = f"captcha.wrong.{uuid.uuid4().hex[:8]}@campuslink.edu"
    password = "CorrectPassword123!"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "role": "STUDENT"},
    )

    login_resp = client.post(
        "/api/v1/auth/login",
        json=captcha_login_payload(email, password, captcha_value="WRONG"),
    )
    assert login_resp.status_code == 400
    data = login_resp.json()
    assert data["error"] == "captcha_invalid"
    assert data["message"] == "Incorrect CAPTCHA. Please try again."
    assert "nextCaptcha" in data


def test_used_captcha_cannot_be_reused():
    email = f"captcha.reuse.{uuid.uuid4().hex[:8]}@campuslink.edu"
    password = "CorrectPassword123!"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "role": "STUDENT"},
    )
    payload = captcha_login_payload(email, password)

    first = client.post("/api/v1/auth/login", json=payload)
    second = client.post("/api/v1/auth/login", json=payload)

    assert first.status_code == 200
    assert second.status_code == 400
    assert second.json()["error"] == "captcha_invalid"


def test_failed_login_consumes_captcha():
    email = f"captcha.consume.{uuid.uuid4().hex[:8]}@campuslink.edu"
    password = "CorrectPassword123!"
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "role": "STUDENT"},
    )
    payload = captcha_login_payload(email, "WrongPassword123!")

    first = client.post("/api/v1/auth/login", json=payload)
    second = client.post("/api/v1/auth/login", json=payload)

    assert first.status_code == 401
    assert second.status_code == 400
    assert second.json()["error"] == "captcha_invalid"


def test_refresh_consumes_previous_captcha_and_returns_next():
    captcha = client.get("/api/v1/auth/captcha").json()["captcha"]
    refreshed = client.post(
        "/api/v1/auth/captcha/refresh",
        json={"captchaToken": captcha["challengeToken"]},
    )

    assert refreshed.status_code == 200
    assert refreshed.json()["captcha"]["challengeToken"] != captcha["challengeToken"]

    with Session(sync_engine) as db:
        challenge = db.execute(
            select(CaptchaChallenge).where(
                CaptchaChallenge.challenge_token == captcha["challengeToken"]
            )
        ).scalar_one()
        assert challenge.used_at is not None


def test_missing_captcha_fields_rejected():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "missing.captcha@campuslink.edu", "password": "Password123!"},
    )
    assert response.status_code == 422


def test_exactly_10_active_master_captchas_exist():
    client.get("/api/v1/auth/captcha")
    with Session(sync_engine) as db:
        active_count = db.execute(
            select(Captcha).where(Captcha.is_active.is_(True))
        ).scalars().all()
        assert len(active_count) == 10


def test_profile_view_and_update():
    """Verify authenticated user can view and update their profile and privacy settings."""
    email = f"profuser.{uuid.uuid4().hex[:8]}@campuslink.edu"
    password = "Password123!"

    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "role": "STUDENT"},
    )
    cookies = reg_resp.cookies

    # Get Profile
    get_prof = client.get("/api/v1/profiles/me", cookies=cookies)
    assert get_prof.status_code == 200
    prof_data = get_prof.json()
    assert prof_data["profile_completed"] is False

    # Update Profile
    update_payload = {
        "full_name": "Jane Student",
        "department": "Computer Science",
        "year": 4,
        "bio": "Senior student specializing in AI systems.",
        "searchable": True,
        "contact_visibility": "PUBLIC",
        "show_email": True,
    }
    patch_prof = client.patch("/api/v1/profiles/me", json=update_payload, cookies=cookies)
    assert patch_prof.status_code == 200
    updated_data = patch_prof.json()
    assert updated_data["full_name"] == "Jane Student"
    assert updated_data["department"] == "Computer Science"
    assert updated_data["year"] == 4
    assert updated_data["contact_visibility"] == "PUBLIC"
    assert updated_data["show_email"] is True
    assert updated_data["profile_completed"] is True


def test_unauthenticated_profile_access_fails():
    """Verify unauthenticated access to /profiles/me returns 401 Unauthorized."""
    fresh_client = TestClient(app)
    response = fresh_client.get("/api/v1/profiles/me")
    assert response.status_code == 401
