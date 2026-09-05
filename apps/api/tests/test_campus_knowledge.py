import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.fixture
def student_cookies():
    """Register and login a student test user."""
    email = f"student_{uuid.uuid4().hex[:8]}@campuslink.edu"
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!", "role": "STUDENT"},
    )
    assert reg_resp.status_code == 201
    return reg_resp.cookies


@pytest.fixture
def faculty_cookies():
    """Register and login a faculty test user."""
    email = f"faculty_{uuid.uuid4().hex[:8]}@campuslink.edu"
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password123!", "role": "FACULTY"},
    )
    assert reg_resp.status_code == 201
    return reg_resp.cookies


# ============================================================
# 1. PROJECTS API TESTS
# ============================================================

def test_project_crud_and_contributors(student_cookies, faculty_cookies):
    # 1. Create project as student
    proj_payload = {
        "title": "Smart Greenhouse Monitor",
        "description": "IoT monitoring system for campus greenhouses.",
        "domain": "IoT",
        "project_type": "CAPSTONE",
        "problem_statement": "Irregular watering in greenhouse.",
        "technologies": ["ESP32", "Python", "FastAPI"],
        "skills": ["ESP32", "Python"],
        "visibility": "PUBLIC",
        "status": "IN_PROGRESS",
    }
    create_resp = client.post("/api/v1/projects", json=proj_payload, cookies=student_cookies)
    assert create_resp.status_code == 201
    proj_data = create_resp.json()
    proj_id = proj_data["id"]
    assert proj_data["title"] == "Smart Greenhouse Monitor"
    assert len(proj_data["contributors"]) == 1
    assert proj_data["contributors"][0]["role"] == "OWNER"

    # 2. List projects
    list_resp = client.get("/api/v1/projects", cookies=student_cookies)
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] >= 1

    # 3. List my projects
    mine_resp = client.get("/api/v1/projects/mine", cookies=student_cookies)
    assert mine_resp.status_code == 200
    mine_ids = [item["id"] for item in mine_resp.json()["items"]]
    assert proj_id in mine_ids

    # 4. Get project by ID
    get_resp = client.get(f"/api/v1/projects/{proj_id}", cookies=student_cookies)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == proj_id

    # 5. Patch project as owner
    patch_resp = client.patch(
        f"/api/v1/projects/{proj_id}",
        json={"status": "COMPLETED", "outcome": "Reduced water consumption by 30%"},
        cookies=student_cookies,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "COMPLETED"
    assert patch_resp.json()["outcome"] == "Reduced water consumption by 30%"

    # 6. Unauthorized patch by faculty (non-owner) should fail
    unauth_patch = client.patch(
        f"/api/v1/projects/{proj_id}",
        json={"title": "Hacked Title"},
        cookies=faculty_cookies,
    )
    assert unauth_patch.status_code == 403

    # 7. Delete project as owner
    del_resp = client.delete(f"/api/v1/projects/{proj_id}", cookies=student_cookies)
    assert del_resp.status_code == 204

    # 8. Verify deleted
    get_del = client.get(f"/api/v1/projects/{proj_id}", cookies=student_cookies)
    assert get_del.status_code == 404


# ============================================================
# 2. RESEARCH API TESTS
# ============================================================

def test_research_crud(faculty_cookies, student_cookies):
    # 1. Create research paper as faculty
    res_payload = {
        "title": "Low Latency Swarm Networks",
        "abstract": "Novel protocol for drone swarms in high interference areas.",
        "research_area": "Robotics",
        "publication_type": "JOURNAL_ARTICLE",
        "publication_venue": "IEEE Robotics Letters",
        "doi": "10.1109/LRA.2026.123456",
        "status": "PUBLISHED",
        "visibility": "PUBLIC",
    }
    create_resp = client.post("/api/v1/research", json=res_payload, cookies=faculty_cookies)
    assert create_resp.status_code == 201
    res_data = create_resp.json()
    res_id = res_data["id"]
    assert res_data["title"] == "Low Latency Swarm Networks"

    # 2. List research
    list_resp = client.get("/api/v1/research", cookies=student_cookies)
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] >= 1

    # 3. Get research by ID
    get_resp = client.get(f"/api/v1/research/{res_id}", cookies=student_cookies)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == res_id

    # 4. Patch research as author
    patch_resp = client.patch(
        f"/api/v1/research/{res_id}",
        json={"abstract": "Updated abstract with refined benchmark results."},
        cookies=faculty_cookies,
    )
    assert patch_resp.status_code == 200
    assert "refined benchmark" in patch_resp.json()["abstract"]

    # 5. Delete research as author
    del_resp = client.delete(f"/api/v1/research/{res_id}", cookies=faculty_cookies)
    assert del_resp.status_code == 204


# ============================================================
# 3. FACILITIES & EQUIPMENT API TESTS
# ============================================================

def test_facilities_and_equipment_flow(faculty_cookies, student_cookies):
    # 1. Student attempts to create facility -> 403 Forbidden
    student_fac = client.post(
        "/api/v1/facilities",
        json={"name": "Unauthorized Lab", "facility_type": "LABORATORY", "location": "Room 101"},
        cookies=student_cookies,
    )
    assert student_fac.status_code == 403

    # 2. Faculty creates lab facility
    fac_payload = {
        "name": "Advanced Embedded Systems Lab",
        "facility_type": "LABORATORY",
        "location": "Building B, Room 202",
        "building": "Building B",
        "floor": "2nd Floor",
        "department": "Electrical Engineering",
        "contact_email": "embedded@campuslink.edu",
        "operating_hours": "09:00 - 18:00",
        "description": "State-of-the-art microcontroller testing lab.",
        "capabilities": "PCB Assembly, Oscilloscope Analysis",
        "status": "OPERATIONAL",
        "visibility": "PUBLIC",
    }
    create_fac = client.post("/api/v1/facilities", json=fac_payload, cookies=faculty_cookies)
    assert create_fac.status_code == 201
    fac_id = create_fac.json()["id"]
    assert create_fac.json()["name"] == "Advanced Embedded Systems Lab"

    # 3. List facilities
    fac_list = client.get("/api/v1/facilities", cookies=student_cookies)
    assert fac_list.status_code == 200
    assert fac_list.json()["total"] >= 1

    # 4. Add equipment to facility as faculty
    eq_payload = {
        "name": "Tektronix Oscilloscope 200MHz",
        "category": "Testing Equipment",
        "description": "4-channel digital storage oscilloscope",
        "capability": "High-frequency signal capture",
        "quantity": 3,
        "status": "OPERATIONAL",
        "availability_status": "AVAILABLE",
        "visibility": "PUBLIC",
    }
    create_eq = client.post(
        f"/api/v1/facilities/{fac_id}/equipment",
        json=eq_payload,
        cookies=faculty_cookies,
    )
    assert create_eq.status_code == 201
    eq_id = create_eq.json()["id"]
    assert create_eq.json()["name"] == "Tektronix Oscilloscope 200MHz"

    # 5. List equipment
    eq_list = client.get("/api/v1/equipment", cookies=student_cookies)
    assert eq_list.status_code == 200
    assert eq_list.json()["total"] >= 1

    # 6. Get equipment detail
    get_eq = client.get(f"/api/v1/equipment/{eq_id}", cookies=student_cookies)
    assert get_eq.status_code == 200
    assert get_eq.json()["id"] == eq_id

    # 7. Update equipment status
    update_eq = client.patch(
        f"/api/v1/equipment/{eq_id}",
        json={"availability_status": "IN_USE"},
        cookies=faculty_cookies,
    )
    assert update_eq.status_code == 200
    assert update_eq.json()["availability_status"] == "IN_USE"

    # 8. Delete equipment & facility
    client.delete(f"/api/v1/equipment/{eq_id}", cookies=faculty_cookies)
    del_fac = client.delete(f"/api/v1/facilities/{fac_id}", cookies=faculty_cookies)
    assert del_fac.status_code == 204


# ============================================================
# 4. PROBLEM / SOLUTION KNOWLEDGE BASE TESTS
# ============================================================

def test_problem_solutions_crud(student_cookies, faculty_cookies):
    # 1. Create problem solution record
    ps_payload = {
        "title": "ESP32 Async MQTT Reconnection Crash",
        "problem": "ESP32 crashes with Guru Meditation Error during MQTT server disconnect.",
        "symptoms": "Reboot loop after network drop.",
        "root_cause": "Dangling pointer in MQTT callback handler on loss of Wi-Fi socket.",
        "solution": "Added null check and unregister handler before re-initialization.",
        "outcome": "Stabilized reconnect behavior across 50 nodes.",
        "lessons_learned": "Clean up network listeners prior to reconnect sequence.",
        "domain": "IoT & Embedded Systems",
        "skills": ["ESP32", "Python"],
        "technologies": ["ESP32", "MQTT", "FreeRTOS"],
        "status": "PUBLISHED",
        "visibility": "PUBLIC",
    }
    create_ps = client.post("/api/v1/solutions", json=ps_payload, cookies=student_cookies)
    assert create_ps.status_code == 201
    ps_id = create_ps.json()["id"]
    assert create_ps.json()["title"] == "ESP32 Async MQTT Reconnection Crash"

    # 2. List problem solutions
    ps_list = client.get("/api/v1/solutions", cookies=faculty_cookies)
    assert ps_list.status_code == 200
    assert ps_list.json()["total"] >= 1

    # 3. List my solutions
    my_ps = client.get("/api/v1/solutions/mine", cookies=student_cookies)
    assert my_ps.status_code == 200
    assert ps_id in [item["id"] for item in my_ps.json()["items"]]

    # 4. Get problem solution by ID
    get_ps = client.get(f"/api/v1/solutions/{ps_id}", cookies=faculty_cookies)
    assert get_ps.status_code == 200
    assert get_ps.json()["id"] == ps_id
    assert len(get_ps.json()["technologies"]) == 3

    # 5. Update problem solution
    patch_ps = client.patch(
        f"/api/v1/solutions/{ps_id}",
        json={"outcome": "Tested for 60 days straight without any crash."},
        cookies=student_cookies,
    )
    assert patch_ps.status_code == 200
    assert "60 days" in patch_ps.json()["outcome"]

    # 6. Delete problem solution
    del_ps = client.delete(f"/api/v1/solutions/{ps_id}", cookies=student_cookies)
    assert del_ps.status_code == 204
