"""Automated Tests for CampusLink AI End-to-End Test Environment & Dataset.

Validates that the synthetic test dataset, privacy fixtures, security fixtures,
recency markers, facilities, search availability, and reset reproducibility are correctly established.
"""
import pytest
from datetime import datetime, timezone
from app.db.session import SyncSessionLocal
from app.models import (
    User, UserRole, Profile, ContactVisibility,
    Project,
    ProblemSolution,
    ResearchItem,
    Facility,
    Document, DocumentExtraction,
)
from app.services.search_service import SearchService
from app.services.embedding_index_service import EmbeddingIndexService
from app.db.seed import run_seed, E2E_METADATA_MARKER
from scripts.reset_test_data import reset_test_environment


def setup_module():
    """Ensure database is reset and fully seeded before executing module test suite."""
    reset_test_environment()


@pytest.fixture(autouse=False)
def db_session():
    """Function-scoped session for reading test environment data."""
    session = SyncSessionLocal()
    yield session
    session.close()


def test_seed_user_counts_and_roles(db_session):
    """Verify minimum 10 synthetic users exist with correct role breakdown."""
    users = db_session.query(User).all()
    assert len(users) >= 10

    students = [u for u in users if u.role == UserRole.STUDENT]
    faculty = [u for u in users if u.role == UserRole.FACULTY]
    alumni = [u for u in users if u.role == UserRole.ALUMNI]
    admins = [u for u in users if u.role == UserRole.ADMIN]

    assert len(students) >= 6
    assert len(faculty) >= 2
    assert len(alumni) >= 1
    assert len(admins) >= 1


def test_expected_student_identities(db_session):
    """Verify synthetic student profiles exist with distinct domain expertise."""
    expected_names = [
        "Aarav Menon",
        "Meera Nair",
        "Rohan Kapoor",
        "Diya Sharma",
        "Vikram Rao",
        "Ananya Iyer",
    ]
    profiles = db_session.query(Profile).all()
    profile_names = {p.full_name for p in profiles}

    for name in expected_names:
        assert name in profile_names, f"Expected student identity '{name}' missing from test dataset."


def test_expected_faculty_and_alumni(db_session):
    """Verify synthetic faculty and alumni accounts exist."""
    profiles = db_session.query(Profile).all()
    profile_names = {p.full_name for p in profiles}

    assert "Dr. Kavitha Raman" in profile_names
    assert "Dr. Arjun Rao" in profile_names
    assert "Siddharth Kumar" in profile_names


def test_admin_account_credentials_and_role(db_session):
    """Verify admin account exists with admin role."""
    admin_user = db_session.query(User).filter(User.email == "admin@campuslink.test").first()
    assert admin_user is not None
    assert admin_user.role == UserRole.ADMIN
    assert admin_user.email_verified is True


def test_privacy_user_b_not_searchable(db_session):
    """Verify User B (Rohan Kapoor) has searchable == False."""
    rohan = db_session.query(Profile).filter(Profile.full_name == "Rohan Kapoor").first()
    assert rohan is not None
    assert rohan.searchable is False


def test_privacy_user_c_contact_visibility_private(db_session):
    """Verify User C (Diya Sharma) has contact_visibility == ContactVisibility.PRIVATE."""
    diya = db_session.query(Profile).filter(Profile.full_name == "Diya Sharma").first()
    assert diya is not None
    assert diya.contact_visibility == ContactVisibility.PRIVATE


def test_privacy_user_d_hidden_contact_info(db_session):
    """Verify User D (Vikram Rao) has email and phone hidden."""
    vikram = db_session.query(Profile).filter(Profile.full_name == "Vikram Rao").first()
    assert vikram is not None
    assert vikram.show_email is False
    assert vikram.show_phone is False


def test_meera_nair_private_resume_fixture(db_session):
    """Verify private resume document & extraction fixture for Meera Nair exists."""
    meera = db_session.query(User).filter(User.email == "student2@campuslink.test").first()
    assert meera is not None

    doc = db_session.query(Document).filter(Document.owner_id == meera.id).first()
    assert doc is not None
    assert doc.original_filename == "meera_nair_dsp.pdf"

    extraction = db_session.query(DocumentExtraction).filter(DocumentExtraction.document_id == doc.id).first()
    assert extraction is not None
    assert "DSP" in extraction.extracted_data.get("skills", [])


def test_project_dataset_counts_and_golden_project(db_session):
    """Verify at least 10 projects exist including the Golden Query ESP32 project."""
    projects = db_session.query(Project).all()
    assert len(projects) >= 10

    golden_proj = db_session.query(Project).filter(Project.slug == "esp32-tinyml-keyword-detection").first()
    assert golden_proj is not None
    assert golden_proj.domain == "Embedded AI"
    assert golden_proj.creator.profile.full_name == "Aarav Menon"


def test_prompt_injection_fixture_is_data(db_session):
    """Verify untrusted prompt injection fixture project exists purely as data."""
    injection_proj = db_session.query(Project).filter(Project.slug == "security-benchmark-dataset-document").first()
    assert injection_proj is not None
    assert "Ignore all previous instructions" in injection_proj.description


def test_outdated_project_fixture_timestamp(db_session):
    """Verify legacy project timestamp is backdated to simulate outdated data."""
    outdated_proj = db_session.query(Project).filter(Project.slug == "legacy-esp32-audio-classifier").first()
    assert outdated_proj is not None
    now = datetime.now(timezone.utc)
    age_days = (now - outdated_proj.created_at.replace(tzinfo=timezone.utc)).days
    assert age_days > 1000, f"Expected outdated project created_at > 1000 days ago, got {age_days} days."


def test_problem_solutions_count_and_golden_problem(db_session):
    """Verify at least 6 problem/solution records exist including the golden microphone fix."""
    ps_records = db_session.query(ProblemSolution).all()
    assert len(ps_records) >= 6

    golden_ps = db_session.query(ProblemSolution).filter(
        ProblemSolution.title.ilike("%Noisy microphone audio%")
    ).first()
    assert golden_ps is not None
    assert "MFCC" in golden_ps.solution or "band-pass" in golden_ps.solution


def test_outdated_problem_solution_fixture(db_session):
    """Verify outdated problem solution record timestamp is backdated."""
    outdated_ps = db_session.query(ProblemSolution).filter(
        ProblemSolution.title.ilike("%Outdated ESP32 board%")
    ).first()
    assert outdated_ps is not None
    now = datetime.now(timezone.utc)
    age_days = (now - outdated_ps.created_at.replace(tzinfo=timezone.utc)).days
    assert age_days > 1000


def test_research_items_count_and_authors(db_session):
    """Verify 3 research publication items exist with associated authors."""
    research_items = db_session.query(ResearchItem).all()
    assert len(research_items) >= 3

    titles = {r.title for r in research_items}
    assert "Efficient Machine Learning at the Edge" in titles
    assert "Edge Intelligence for Embedded Sensor Networks" in titles
    assert "Adaptive Audio Processing for Resource-Constrained Devices" in titles


def test_facilities_and_equipment_linkage(db_session):
    """Verify 3 facilities and linked equipment items exist."""
    facilities = db_session.query(Facility).all()
    assert len(facilities) >= 3

    fac_names = {f.name for f in facilities}
    assert "Embedded AI Laboratory" in fac_names
    assert "Digital Signal Processing Laboratory" in fac_names
    assert "Computer Vision Laboratory" in fac_names

    embedded_lab = db_session.query(Facility).filter(Facility.name == "Embedded AI Laboratory").first()
    assert len(embedded_lab.equipment) >= 3
    eq_names = {e.name for e in embedded_lab.equipment}
    assert "ESP32-S3 Development Boards" in eq_names
    assert "I2S MEMS Microphones" in eq_names


def test_dataset_metadata_marker(db_session):
    """Verify synthetic dataset records contain provenance marker."""
    projects = db_session.query(Project).filter(Project.provenance == E2E_METADATA_MARKER).all()
    assert len(projects) >= 8


def test_golden_query_retrieval(db_session):
    """Verify golden query retrieves ESP32 TinyML keyword detection content."""
    search_service = SearchService()
    res = search_service.search(
        db_session,
        query="My ESP32 microphone works but TinyML keyword detection accuracy is poor",
        mode="HYBRID",
        limit=10,
    )
    assert len(res.results) > 0
    contents = [f"{r.title} {r.snippet}".lower() for r in res.results]
    assert any(
        any(k in c for k in ["esp32", "keyword", "noisy microphone", "tinyml", "aarav"]) for c in contents
    )


def test_dsp_query_retrieval(db_session):
    """Verify DSP noise reduction query retrieves spectral filtering content."""
    search_service = SearchService()
    res = search_service.search(
        db_session,
        query="microphone noise reduction DSP spectral",
        mode="HYBRID",
        limit=10,
    )
    assert len(res.results) > 0
    contents = [f"{r.title} {r.snippet}".lower() for r in res.results]
    assert any(
        any(k in c for k in ["noise", "dsp", "microphone", "meera", "spectral"]) for c in contents
    )


def test_model_quantization_query_retrieval(db_session):
    """Verify model optimization query retrieves model compression content."""
    search_service = SearchService()
    res = search_service.search(
        db_session,
        query="TinyML model quantization memory optimization",
        mode="HYBRID",
        limit=10,
    )
    assert len(res.results) > 0
    contents = [f"{r.title} {r.snippet}".lower() for r in res.results]
    assert any(
        any(k in c for k in ["compression", "optimization", "quantization", "diya", "arjun"]) for c in contents
    )


def test_computer_vision_query_retrieval(db_session):
    """Verify computer vision query retrieves OpenCV vision content."""
    search_service = SearchService()
    res = search_service.search(
        db_session,
        query="object detection OpenCV computer vision",
        mode="HYBRID",
        limit=10,
    )
    assert len(res.results) > 0
    contents = [f"{r.title} {r.snippet}".lower() for r in res.results]
    assert any(
        any(k in c for k in ["vision", "opencv", "object detection", "vikram"]) for c in contents
    )


def test_search_privacy_exclusion(db_session):
    """Verify unsearchable user B (Rohan Kapoor) is excluded from profile searches."""
    search_service = SearchService()
    res = search_service.search(
        db_session,
        query="Rohan Kapoor Embedded Systems",
        mode="HYBRID",
        entity_types=["PROFILE"],
        limit=10,
    )
    returned_names = [r.title for r in res.results]
    assert "Rohan Kapoor" not in returned_names


def test_z_reset_script_reproducibility(db_session):
    """Verify reset_test_environment executes cleanly and reproducibly (run last)."""
    reset_test_environment()
    db_session.expire_all()
    users_count = db_session.query(User).count()
    assert users_count >= 10
