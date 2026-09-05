import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import AsyncSessionLocal
from app.models.users import User, UserRole, UserStatus
from app.core.security import verify_password

client = TestClient(app)


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
        json={"email": email, "password": password},
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
        json={"email": email, "password": "WrongPassword123!"},
    )
    assert login_resp.status_code == 401
    assert login_resp.json()["detail"] == "Invalid email or password."


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
