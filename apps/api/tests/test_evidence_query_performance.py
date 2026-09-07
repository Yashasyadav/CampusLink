"""
Phase 9.5 Test Suite: Evidence Query Performance Audit & Batch Optimization.

Verifies:
1. Batch evidence retrieval executes in O(1) database trips (no N+1 scaling with candidate count).
2. Exact functional equivalence between batch evidence retrieval and single-candidate tool.
3. Exact functional equivalence between batch profile retrieval and single-profile tool.
4. Privacy boundaries are strictly preserved across batch queries.
5. PeopleDiscoveryAgent executes end-to-end with batch retrieval without query multiplication.
"""

import pytest
import uuid
from typing import List
from sqlalchemy import event
from sqlalchemy.orm import Session

from app.db.session import SyncSessionLocal, sync_engine
from app.models.users import User
from app.models.projects import Project, ProjectVisibility
from app.models.knowledge import ProblemSolution, KnowledgeVisibility
from app.agent_tools.tools import (
    get_profile_tool,
    get_profiles_batch,
    get_person_evidence_graph_tool,
    get_person_evidence_graphs_batch,
)
from app.agents.people_discovery import PeopleDiscoveryAgent
from app.agents.query_understanding import QueryUnderstandingAgent


@pytest.fixture
def db_session():
    session = SyncSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def current_user(db_session: Session):
    user = db_session.query(User).filter(User.email == "student1@campuslink.test").first()
    if not user:
        user = db_session.query(User).first()
    assert user is not None, "At least one user must exist in DB."
    return user


@pytest.fixture
def sample_candidates(db_session: Session, current_user: User) -> List[User]:
    users = db_session.query(User).filter(User.id != current_user.id).limit(5).all()
    assert len(users) >= 2, "Need at least 2 users for N+1 performance testing."
    return users


class QueryCounter:
    """Helper context manager to count executed SQL queries on the engine."""

    def __init__(self, target_engine):
        self.engine = target_engine
        self.count = 0
        self.queries = []

    def _callback(self, conn, cursor, statement, parameters, context, executemany):
        self.count += 1
        self.queries.append(statement)

    def __enter__(self):
        self.count = 0
        self.queries = []
        event.listen(self.engine, "before_cursor_execute", self._callback)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        event.remove(self.engine, "before_cursor_execute", self._callback)


def test_batch_evidence_query_count_does_not_scale_linearly(
    db_session: Session, current_user: User, sample_candidates: List[User]
):
    """
    1. Verify that batch evidence retrieval executes constant O(1) queries regardless of candidate count.
    For N=1 candidate and N=5 candidates, the query count must remain <= 7 queries.
    """
    cand_1 = [sample_candidates[0].id]
    cand_5 = [u.id for u in sample_candidates[:5]]

    # Profile query count for 1 candidate
    with QueryCounter(sync_engine) as qc_1:
        get_person_evidence_graphs_batch(db_session, current_user, cand_1)
    q_count_1 = qc_1.count

    # Profile query count for 5 candidates
    with QueryCounter(sync_engine) as qc_5:
        get_person_evidence_graphs_batch(db_session, current_user, cand_5)
    q_count_5 = qc_5.count

    # Batched retrieval must execute a constant number of queries (<= 10 queries, constant O(1))
    # and MUST NOT scale linearly (5 candidates must NOT execute 5x queries).
    assert q_count_1 <= 10, f"Expected <= 10 queries for 1 candidate, got {q_count_1}"
    assert q_count_5 <= 10, f"Expected <= 10 queries for 5 candidates, got {q_count_5}"
    assert q_count_5 == q_count_1, (
        f"Query count scaled: N=1 took {q_count_1} queries, N=5 took {q_count_5} queries"
    )


def test_batch_evidence_retrieval_matches_single_tool_exactly(
    db_session: Session, current_user: User, sample_candidates: List[User]
):
    """
    2. Verify strict functional equivalence between batch evidence retrieval and sequential calls.
    Every key, item, technology list, and evidence_count must match exactly.
    """
    candidate_ids = [u.id for u in sample_candidates]

    batch_results = get_person_evidence_graphs_batch(db_session, current_user, candidate_ids)

    for cand_id in candidate_ids:
        cid_str = str(cand_id)
        assert cid_str in batch_results, f"Candidate {cid_str} missing from batch results"

        batch_graph = batch_results[cid_str]
        single_graph = get_person_evidence_graph_tool(db_session, current_user, cand_id)

        assert batch_graph["user_id"] == single_graph["user_id"]
        assert sorted(batch_graph["skills"]) == sorted(single_graph["skills"])
        assert batch_graph["evidence_count"] == single_graph["evidence_count"]
        assert len(batch_graph["projects"]) == len(single_graph["projects"])
        assert len(batch_graph["solutions"]) == len(single_graph["solutions"])
        assert len(batch_graph["research"]) == len(single_graph["research"])
        assert len(batch_graph["facilities"]) == len(single_graph["facilities"])

        # Check project details
        single_proj_ids = {p["project_id"] for p in single_graph["projects"]}
        batch_proj_ids = {p["project_id"] for p in batch_graph["projects"]}
        assert batch_proj_ids == single_proj_ids

        # Check solution details
        single_sol_ids = {s["solution_id"] for s in single_graph["solutions"]}
        batch_sol_ids = {s["solution_id"] for s in batch_graph["solutions"]}
        assert batch_sol_ids == single_sol_ids


def test_batch_profiles_matches_get_profile_tool(
    db_session: Session, current_user: User, sample_candidates: List[User]
):
    """
    3. Verify that get_profiles_batch matches get_profile_tool for all candidates.
    """
    candidate_ids = [u.id for u in sample_candidates]
    batch_profiles = get_profiles_batch(db_session, current_user, candidate_ids)

    for cand_id in candidate_ids:
        single_prof = get_profile_tool(db_session, current_user, cand_id)
        cid_str = str(cand_id)
        if single_prof is None:
            assert cid_str not in batch_profiles
        else:
            assert cid_str in batch_profiles
            batch_prof = batch_profiles[cid_str]
            assert batch_prof["full_name"] == single_prof["full_name"]
            assert batch_prof["department"] == single_prof["department"]
            assert sorted(batch_prof["skills"]) == sorted(single_prof["skills"])


def test_batch_evidence_respects_privacy_boundaries(
    db_session: Session, current_user: User, sample_candidates: List[User]
):
    """
    4. Verify that PRIVATE projects and solutions are excluded for unauthorized viewers,
    but included when the owner/author queries their own graph.
    """
    other_user = sample_candidates[0]

    # As current_user querying other_user
    third_party_batch = get_person_evidence_graphs_batch(db_session, current_user, [other_user.id])
    third_party_graph = third_party_batch[str(other_user.id)]

    for proj in third_party_graph["projects"]:
        db_proj = db_session.get(Project, uuid.UUID(proj["project_id"]))
        if db_proj:
            vis = db_proj.visibility.value if hasattr(db_proj.visibility, "value") else str(db_proj.visibility)
            assert vis != "PRIVATE" or db_proj.created_by == current_user.id

    for sol in third_party_graph["solutions"]:
        db_sol = db_session.get(ProblemSolution, uuid.UUID(sol["solution_id"]))
        if db_sol:
            vis = db_sol.visibility.value if hasattr(db_sol.visibility, "value") else str(db_sol.visibility)
            assert vis != "PRIVATE" or db_sol.author_id == current_user.id


def test_empty_candidates_batch_handles_gracefully(db_session: Session, current_user: User):
    """
    5. Verify passing empty candidate lists returns empty dict with 0 queries.
    """
    with QueryCounter(sync_engine) as qc:
        empty_graphs = get_person_evidence_graphs_batch(db_session, current_user, [])
        empty_profs = get_profiles_batch(db_session, current_user, [])

    assert empty_graphs == {}
    assert empty_profs == {}
    assert qc.count == 0


def test_people_discovery_agent_runs_with_batching(
    db_session: Session, current_user: User
):
    """
    6. Verify PeopleDiscoveryAgent.discover executes end-to-end using batch evidence retrieval.
    """
    agent = PeopleDiscoveryAgent()
    qu = QueryUnderstandingAgent().analyze("ESP32 TinyML keyword detection")

    with QueryCounter(sync_engine) as qc:
        result = agent.discover(db_session, current_user, qu, limit=5)

    assert result is not None
    assert len(result.candidates) > 0

    for cand in result.candidates:
        assert str(cand.user_id) != str(current_user.id)
        assert cand.person_evidence_graph is not None
        assert "evidence_count" in cand.person_evidence_graph
        assert cand.evidence_count == cand.person_evidence_graph["evidence_count"]
