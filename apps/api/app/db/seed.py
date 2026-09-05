"""Development Seed Data Script for CampusLink AI.

Populates synthetic test data (users, profiles, skills, projects, facilities, research, problem-solutions).
DO NOT USE REAL SECRETS OR REAL PERSONAL INFORMATION.
"""
import uuid
import logging
from datetime import date, datetime, timezone
from sqlalchemy.orm import Session
from app.db.session import sync_engine, SyncSessionLocal
from app.models import (
    User, UserRole, UserStatus,
    Profile, ContactVisibility,
    Skill, UserSkill, ProficiencyLevel, SkillSource,
    Project, ProjectContributor, ProjectSkill, ProjectTechnology,
    ProjectVisibility, ProjectStatus, ProjectType, ContributorRole,
    Facility, Equipment, FacilityStatus, EquipmentStatus, AvailabilityStatus, FacilityVisibility, EquipmentVisibility,
    ResearchItem, ResearchStatus, ResearchVisibility, PublicationType, ResearchAuthor,
    ProblemSolution, KnowledgeVisibility, ProblemSolutionStatus, ProblemSolutionSkill, ProblemSolutionTechnology,
    Connection, ConnectionStatus,
)

logger = logging.getLogger("campuslink.seed")


def run_seed():
    """Populates synthetic initial database records."""
    logger.info("Starting database seed process...")
    session: Session = SyncSessionLocal()

    try:
        # Check if seed data already exists
        existing_users = session.query(User).count()
        if existing_users > 0:
            logger.info(f"Database already contains {existing_users} users. Skipping seed.")
            return

        # 1. Create Skills
        skills_data = [
            ("Python", "python", "Programming Languages"),
            ("React", "react", "Frameworks"),
            ("FastAPI", "fastapi", "Frameworks"),
            ("TensorFlow", "tensorflow", "Machine Learning"),
            ("ESP32", "esp32", "Hardware & Embedded"),
            ("PostgreSQL", "postgresql", "Databases"),
            ("Robotics", "robotics", "Engineering"),
            ("PyTorch", "pytorch", "Machine Learning"),
            ("Cybersecurity", "cybersecurity", "Security"),
            ("Docker", "docker", "DevOps"),
            ("FreeRTOS", "freertos", "Operating Systems"),
        ]
        skills = {}
        for name, norm_name, category in skills_data:
            skill = Skill(name=name, normalized_name=norm_name, category=category)
            session.add(skill)
            skills[norm_name] = skill
        session.flush()

        # 2. Create Users & Profiles
        # Synthetic Student 1
        student1 = User(
            email="dev.student1@campuslink.edu",
            password_hash="dev_pbkdf2_sha256_synthetic_hash_student1",
            role=UserRole.STUDENT,
            status=UserStatus.ACTIVE,
            email_verified=True,
        )
        student1_profile = Profile(
            user=student1,
            full_name="Alex Chen",
            department="Computer Science & Engineering",
            year=4,
            bio="Senior CS student focusing on IoT Systems and Embedded Microcontrollers.",
            github_url="https://github.com/synthetic-alexchen",
            linkedin_url="https://linkedin.com/in/synthetic-alexchen",
            searchable=True,
            contact_visibility=ContactVisibility.PUBLIC,
            profile_completed=True,
        )

        # Synthetic Student 2
        student2 = User(
            email="dev.student2@campuslink.edu",
            password_hash="dev_pbkdf2_sha256_synthetic_hash_student2",
            role=UserRole.STUDENT,
            status=UserStatus.ACTIVE,
            email_verified=True,
        )
        student2_profile = Profile(
            user=student2,
            full_name="Priya Sharma",
            department="Artificial Intelligence & Data Science",
            year=3,
            bio="Junior AI student building computer vision models for autonomous systems.",
            github_url="https://github.com/synthetic-priyasharma",
            searchable=True,
            contact_visibility=ContactVisibility.CONNECTIONS_ONLY,
            profile_completed=True,
        )

        # Synthetic Faculty Member
        faculty1 = User(
            email="dev.faculty1@campuslink.edu",
            password_hash="dev_pbkdf2_sha256_synthetic_hash_faculty1",
            role=UserRole.FACULTY,
            status=UserStatus.ACTIVE,
            email_verified=True,
        )
        faculty1_profile = Profile(
            user=faculty1,
            full_name="Dr. Marcus Vance",
            department="Electrical & Computer Engineering",
            designation="Associate Professor",
            bio="Lead Researcher in Embedded Systems, Autonomous Robotics, and Edge AI.",
            portfolio_url="https://ece.campuslink.edu/faculty/marcusvance",
            searchable=True,
            contact_visibility=ContactVisibility.PUBLIC,
            profile_completed=True,
        )

        session.add_all([student1, student2, faculty1])
        session.flush()

        # 3. User Skills
        user_skills_data = [
            (student1, skills["python"], ProficiencyLevel.ADVANCED, SkillSource.USER),
            (student1, skills["esp32"], ProficiencyLevel.EXPERT, SkillSource.PROJECT),
            (student1, skills["fastapi"], ProficiencyLevel.INTERMEDIATE, SkillSource.RESUME),
            (student2, skills["python"], ProficiencyLevel.EXPERT, SkillSource.USER),
            (student2, skills["tensorflow"], ProficiencyLevel.ADVANCED, SkillSource.PROJECT),
            (student2, skills["pytorch"], ProficiencyLevel.ADVANCED, SkillSource.USER),
            (faculty1, skills["robotics"], ProficiencyLevel.EXPERT, SkillSource.USER),
            (faculty1, skills["esp32"], ProficiencyLevel.EXPERT, SkillSource.USER),
        ]
        for user_obj, skill_obj, prof, src in user_skills_data:
            session.add(
                UserSkill(
                    user=user_obj,
                    skill=skill_obj,
                    proficiency=prof,
                    source=src,
                    confidence=1.0,
                )
            )

        # 4. Facilities & Equipment
        facility1 = Facility(
            name="Robotics & Autonomous Systems Lab",
            facility_type="LABORATORY",
            location="Engineering Block C, Room 304",
            building="Block C",
            floor="3rd Floor",
            department="Electrical & Computer Engineering",
            contact_email="robotics-lab@campuslink.edu",
            operating_hours="Mon-Fri 08:00 - 20:00",
            description="Advanced research laboratory equipped with motion capture, GPU workstations, and prototyping tools.",
            capabilities="Robot operating system testing, 3D printing, circuit prototyping.",
            responsible_user=faculty1,
            status=FacilityStatus.OPERATIONAL,
            visibility=FacilityVisibility.PUBLIC,
        )
        session.add(facility1)
        session.flush()

        eq1 = Equipment(
            facility=facility1,
            name="NVIDIA RTX 4090 Workstation Cluster",
            category="Computing Hardware",
            description="4x GPU server node dedicated to deep learning training and vision processing.",
            capability="High-throughput model training, CUDA acceleration, real-time sensor processing.",
            quantity=2,
            status=EquipmentStatus.OPERATIONAL,
            availability_status=AvailabilityStatus.AVAILABLE,
            visibility=EquipmentVisibility.PUBLIC,
        )
        eq2 = Equipment(
            facility=facility1,
            name="Rigol 4-Channel Digital Oscilloscope",
            category="Measurement Equipment",
            description="100MHz digital storage oscilloscope for signal integrity debugging.",
            capability="Logic timing analysis, signal noise inspection.",
            quantity=5,
            status=EquipmentStatus.OPERATIONAL,
            availability_status=AvailabilityStatus.AVAILABLE,
            visibility=EquipmentVisibility.PUBLIC,
        )
        session.add_all([eq1, eq2])

        # 5. Projects & Contributors
        project1 = Project(
            title="Smart Campus AgTech IoT Network",
            slug="smart-campus-agtech-iot",
            description="Distributed soil moisture and microclimate sensing network deployed across campus greenhouses using ESP32 nodes.",
            domain="IoT & Embedded Systems",
            project_type=ProjectType.CAPSTONE,
            problem_statement="Automating irrigation based on real-time sensor analytics instead of static timers.",
            methodology="LoRaWAN mesh network communicating with central FastAPI gateway.",
            outcome="Reduced water usage by 35% across test greenhouse plots.",
            visibility=ProjectVisibility.PUBLIC,
            status=ProjectStatus.COMPLETED,
            start_date=date(2025, 9, 1),
            end_date=date(2026, 2, 28),
            creator=student1,
        )
        session.add(project1)
        session.flush()

        contrib1 = ProjectContributor(
            project=project1,
            user=student1,
            role=ContributorRole.OWNER,
            contribution_description="Designed ESP32 firmware and power management sub-system.",
        )
        contrib2 = ProjectContributor(
            project=project1,
            user=faculty1,
            role=ContributorRole.FACULTY_GUIDE,
            contribution_description="Supervised sensor calibration and network topology.",
        )
        session.add_all([contrib1, contrib2])

        # Project Technologies & Skills
        session.add(ProjectTechnology(project=project1, name="ESP32", normalized_name="esp32", category="Hardware"))
        session.add(ProjectTechnology(project=project1, name="FastAPI", normalized_name="fastapi", category="Backend"))
        session.add(ProjectSkill(project=project1, skill=skills["esp32"]))
        session.add(ProjectSkill(project=project1, skill=skills["fastapi"]))

        # 6. Research Items
        research1 = ResearchItem(
            owner=faculty1,
            title="Energy-Efficient Communication Topologies for Multi-Agent Edge Swarms",
            abstract="We propose an adaptive routing technique for micro-aerial vehicles operating under lossy RF environments.",
            research_area="Robotics & Autonomous Networks",
            publication_type=PublicationType.JOURNAL_ARTICLE,
            publication_venue="IEEE Transactions on Autonomous Systems",
            publication_date=date(2026, 1, 15),
            doi="10.1000/synthetic.research.2026.01",
            publication_url="https://doi.org/10.1000/synthetic.research.2026.01",
            status=ResearchStatus.PUBLISHED,
            visibility=ResearchVisibility.PUBLIC,
        )
        session.add(research1)
        session.flush()

        ra1 = ResearchAuthor(
            research_item=research1,
            user=faculty1,
            author_name="Dr. Marcus Vance",
            author_order=1,
            affiliation="CampusLink ECE Department",
        )
        ra2 = ResearchAuthor(
            research_item=research1,
            user=student2,
            author_name="Priya Sharma",
            author_order=2,
            affiliation="CampusLink AI & DS Department",
        )
        session.add_all([ra1, ra2])

        # 7. Problem / Solution Institutional Memory
        problem1 = ProblemSolution(
            author=student1,
            project=project1,
            research=research1,
            title="ESP32 Asynchronous Wi-Fi Reconnection Loop Fix",
            problem="ESP32 nodes intermittently dropped Wi-Fi connectivity during sleep transitions, blocking HTTP POST telemetry delivery.",
            symptoms="HTTP request timeout errors occurring every 45 minutes in server logs.",
            root_cause="Wi-Fi station state machine was not re-initialized before socket creation following light-sleep wakeup.",
            solution="Implemented exponential backoff retry handler with explicit WiFi.reconnect() call prior to socket binding.",
            outcome="Zero telemetry loss recorded over 30-day benchmark test.",
            lessons_learned="Always check link status after sleep wakeup before initiating network requests on ESP32 microcontrollers.",
            domain="IoT & Embedded Systems",
            status=ProblemSolutionStatus.PUBLISHED,
            visibility=KnowledgeVisibility.PUBLIC,
        )
        session.add(problem1)
        session.flush()

        session.add(ProblemSolutionSkill(problem_solution=problem1, skill=skills["esp32"]))
        session.add(ProblemSolutionSkill(problem_solution=problem1, skill=skills["fastapi"]))
        session.add(ProblemSolutionTechnology(problem_solution=problem1, name="ESP32", normalized_name="esp32"))
        session.add(ProblemSolutionTechnology(problem_solution=problem1, name="FreeRTOS", normalized_name="freertos"))

        # 8. Connections
        conn1 = Connection(
            requester=student2,
            recipient=faculty1,
            reason="Seeking research guidance on embedded vision optimization for small autonomous rovers.",
            status=ConnectionStatus.PENDING,
        )
        session.add(conn1)

        session.commit()
        logger.info("Database seed completed successfully with synthetic records!")

    except Exception as e:
        session.rollback()
        logger.error(f"Error seeding database: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_seed()

