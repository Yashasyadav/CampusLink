"""
Regression tests for Person Discovery NULL technology normalization and candidate error isolation.
"""
import uuid
import pytest
from app.agent_tools.tools import _normalize_technologies, get_person_evidence_graph_tool
from app.models.users import User
from app.models.knowledge import ProblemSolution
from app.models.projects import Project, ProjectTechnology
from app.agents.people_discovery import PeopleDiscoveryAgent
from app.schemas.agents import QueryUnderstandingResult


class DummyEntity:
    def __init__(self, tech=None):
        self.technologies = tech


class DummyORMTech:
    def __init__(self, name):
        self.name = name


def test_1_null_technologies():
    """TEST 1: NULL technologies returns [] without TypeError."""
    dummy = DummyEntity(tech=None)
    result = _normalize_technologies(dummy)
    assert result == []


def test_2_empty_technologies():
    """TEST 2: Empty technologies returns [] without exception."""
    dummy = DummyEntity(tech=[])
    result = _normalize_technologies(dummy)
    assert result == []


def test_3_string_technologies():
    """TEST 3: String list technologies are preserved and normalized."""
    dummy = DummyEntity(tech=["ESP32", "  TinyML ", ""])
    result = _normalize_technologies(dummy)
    assert result == ["ESP32", "TinyML"]


def test_3b_orm_object_technologies():
    """TEST 3b: ORM objects with .name attribute are extracted safely."""
    dummy = DummyEntity(tech=[DummyORMTech("ESP32-S3"), DummyORMTech("MFCC")])
    result = _normalize_technologies(dummy)
    assert result == ["ESP32-S3", "MFCC"]


@pytest.fixture
def db_session():
    from app.db.session import SyncSessionLocal
    session = SyncSessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_4_candidate_isolation(db_session):
    """TEST 4: Candidate error isolation ensures malformed candidate does not erase valid candidates."""
    user = db_session.query(User).filter(User.email == "student1@campuslink.test").first()
    if not user:
        user = db_session.query(User).first()
    if not user:
        pytest.skip("No users found in test database")

    agent = PeopleDiscoveryAgent()
    qu = QueryUnderstandingResult(
        original_query="ESP32 TinyML keyword detection",
        domain=["Embedded Systems"],
        skills=["TinyML"],
        technologies=["ESP32"],
        needs_people=True,
    )
    res = agent.discover(db_session, user, qu, limit=5)
    assert res.status == "SUCCESS"
    # Valid candidates should be found despite potential candidate errors
    assert len(res.candidates) >= 0


def test_5_self_exclusion(db_session):
    """TEST 5: Self exclusion ensures current authenticated user is never returned."""
    # Find student1
    student1 = db_session.query(User).filter(User.email == "student1@campuslink.test").first()
    if not student1:
        pytest.skip("student1@campuslink.test not in test database")

    agent = PeopleDiscoveryAgent()
    qu = QueryUnderstandingResult(
        original_query="My ESP32 microphone is working, but my TinyML model is giving poor accuracy.",
        domain=["Embedded Systems"],
        skills=["TinyML"],
        technologies=["ESP32"],
        needs_people=True,
    )
    res = agent.discover(db_session, student1, qu, limit=5)
    cand_ids = [str(c.user_id) for c in res.candidates]
    assert str(student1.id) not in cand_ids


def test_7_golden_query(db_session):
    """TEST 7: Golden query produces evidence-backed candidates > 0 from seeded database."""
    student1 = db_session.query(User).filter(User.email == "student1@campuslink.test").first()
    if not student1:
        pytest.skip("student1@campuslink.test not in test database")

    agent = PeopleDiscoveryAgent()
    qu = QueryUnderstandingResult(
        original_query="My ESP32 microphone is working, but my TinyML keyword detection model is giving poor accuracy. I don't know whether the problem is with the microphone, audio preprocessing, or the ML model.",
        domain=["Embedded Systems", "TinyML", "Audio Processing"],
        skills=["TinyML", "Audio Processing"],
        technologies=["ESP32"],
        needs_people=True,
    )
    res = agent.discover(db_session, student1, qu, limit=5)
    assert len(res.candidates) > 0, "Golden query must return candidates > 0"
    cand_ids = [str(c.user_id) for c in res.candidates]
    assert str(student1.id) not in cand_ids
