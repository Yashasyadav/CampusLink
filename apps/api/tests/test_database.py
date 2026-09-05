import pytest
import uuid
from sqlalchemy import text, select
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import IntegrityError
from app.db.session import AsyncSessionLocal
from app.models import (
    User, UserRole, UserStatus,
    Profile, ContactVisibility,
    Skill, UserSkill, ProficiencyLevel, SkillSource,
    Project, ProjectContributor, ProjectSkill, ContributorRole,
    Facility, Equipment, FacilityStatus, EquipmentStatus, AvailabilityStatus,
    ProblemSolution, KnowledgeVisibility,
    Connection, ConnectionStatus,
)


@pytest.mark.asyncio
async def test_database_connection_and_pgvector():
    """Verify PostgreSQL connectivity and pgvector extension availability."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT 1;"))
        assert result.scalar() == 1

        vector_res = await session.execute(
            text("SELECT extname FROM pg_extension WHERE extname = 'vector';")
        )
        assert vector_res.scalar() == "vector"


@pytest.mark.asyncio
async def test_user_and_profile_persistence():
    """Verify User and Profile creation and 1-to-1 relationship cascade."""
    async with AsyncSessionLocal() as session:
        test_email = f"test.user.{uuid.uuid4().hex[:8]}@campuslink.edu"
        user = User(
            email=test_email,
            password_hash="test_hash_123",
            role=UserRole.STUDENT,
            status=UserStatus.ACTIVE,
        )
        profile = Profile(
            user=user,
            full_name="Test Student",
            department="Computer Science",
            year=3,
            searchable=True,
            contact_visibility=ContactVisibility.CONNECTIONS_ONLY,
        )
        session.add(user)
        await session.commit()

        # Query user with profile loaded via selectinload
        res = await session.execute(
            select(User).options(selectinload(User.profile)).filter_by(id=user.id)
        )
        fetched_user = res.scalar_one()

        assert fetched_user.id is not None
        assert fetched_user.profile is not None
        assert fetched_user.profile.full_name == "Test Student"

        # Cleanup
        await session.delete(fetched_user)
        await session.commit()


@pytest.mark.asyncio
async def test_user_skills_relationship():
    """Verify User-Skill many-to-many persistence and uniqueness constraint."""
    async with AsyncSessionLocal() as session:
        user = User(
            email=f"skill.user.{uuid.uuid4().hex[:8]}@campuslink.edu",
            password_hash="test_hash",
            role=UserRole.STUDENT,
        )
        skill = Skill(name="TestSkillPy", normalized_name=f"testskillpy_{uuid.uuid4().hex[:6]}", category="Testing")
        session.add_all([user, skill])
        await session.commit()

        user_skill = UserSkill(
            user_id=user.id,
            skill_id=skill.id,
            proficiency=ProficiencyLevel.ADVANCED,
            source=SkillSource.USER,
        )
        session.add(user_skill)
        await session.commit()

        # Verify duplicate user skill constraint failure
        dup_user_skill = UserSkill(
            user_id=user.id,
            skill_id=skill.id,
            proficiency=ProficiencyLevel.BEGINNER,
        )
        session.add(dup_user_skill)
        with pytest.raises(IntegrityError):
            await session.commit()
        await session.rollback()

        # Cleanup
        await session.delete(user)
        await session.delete(skill)
        await session.commit()


@pytest.mark.asyncio
async def test_project_and_contributors():
    """Verify Project and ProjectContributor relationship persistence."""
    async with AsyncSessionLocal() as session:
        user = User(
            email=f"owner.{uuid.uuid4().hex[:8]}@campuslink.edu",
            password_hash="test_hash",
        )
        session.add(user)
        await session.commit()

        project = Project(
            title="Test Autonomous System",
            slug=f"test-project-{uuid.uuid4().hex[:6]}",
            description="Testing autonomous vehicle control algorithms.",
            domain="Robotics",
            created_by=user.id,
        )
        session.add(project)
        await session.commit()

        contributor = ProjectContributor(
            project_id=project.id,
            user_id=user.id,
            role=ContributorRole.OWNER,
        )
        session.add(contributor)
        await session.commit()

        res = await session.execute(
            select(Project).options(selectinload(Project.contributors)).filter_by(id=project.id)
        )
        fetched_project = res.scalar_one()

        assert len(fetched_project.contributors) == 1
        assert fetched_project.contributors[0].user_id == user.id

        # Cleanup
        await session.delete(fetched_project)
        await session.delete(user)
        await session.commit()


@pytest.mark.asyncio
async def test_facility_and_equipment():
    """Verify Facility and Equipment 1-to-many relationship persistence."""
    async with AsyncSessionLocal() as session:
        facility = Facility(
            name=f"Test Lab {uuid.uuid4().hex[:4]}",
            facility_type="LABORATORY",
            location="Building B",
            status=FacilityStatus.OPERATIONAL,
        )
        session.add(facility)
        await session.commit()

        equipment = Equipment(
            facility_id=facility.id,
            name="Test Oscilloscope",
            category="Measurement",
            quantity=1,
            status=EquipmentStatus.OPERATIONAL,
            availability_status=AvailabilityStatus.AVAILABLE,
        )
        session.add(equipment)
        await session.commit()

        res = await session.execute(
            select(Facility).options(selectinload(Facility.equipment)).filter_by(id=facility.id)
        )
        fetched_facility = res.scalar_one()

        assert len(fetched_facility.equipment) == 1
        assert fetched_facility.equipment[0].name == "Test Oscilloscope"

        # Cleanup
        await session.delete(fetched_facility)
        await session.commit()


@pytest.mark.asyncio
async def test_connection_self_connection_check_constraint():
    """Verify that a user cannot send a connection request to themselves."""
    async with AsyncSessionLocal() as session:
        user = User(
            email=f"selfconn.{uuid.uuid4().hex[:8]}@campuslink.edu",
            password_hash="test_hash",
        )
        session.add(user)
        await session.commit()

        invalid_conn = Connection(
            requester_id=user.id,
            recipient_id=user.id,
            reason="Self test",
            status=ConnectionStatus.PENDING,
        )
        session.add(invalid_conn)
        with pytest.raises(IntegrityError):
            await session.commit()
        await session.rollback()

        # Cleanup
        await session.delete(user)
        await session.commit()
