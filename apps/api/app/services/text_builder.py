"""Deterministic and Privacy-Aware Text Representation Builders for CampusLink AI Entities."""

from typing import Optional, Dict, Any
from app.models.profiles import Profile
from app.models.projects import Project
from app.models.research import ResearchItem
from app.models.facilities import Facility, Equipment
from app.models.knowledge import ProblemSolution
from app.models.users import User


def build_profile_text(profile: Profile, user: Optional[User] = None) -> Optional[str]:
    """
    Build deterministic text representation for a user profile.
    Returns None if profile is not searchable.
    Enforces privacy rules (no passwords, tokens, private phone/email).
    """
    if not profile or not profile.searchable:
        return None

    parts = []
    
    # 1. Identity & Role
    if profile.full_name:
        parts.append(f"Name: {profile.full_name.strip()}")
    
    role_parts = []
    if profile.designation:
        role_parts.append(profile.designation.strip())
    if profile.department:
        role_parts.append(profile.department.strip())
    if profile.year:
        role_parts.append(f"Year {profile.year}")
    if role_parts:
        parts.append(f"Role: {', '.join(role_parts)}")

    if profile.location:
        parts.append(f"Location: {profile.location.strip()}")

    # 2. Bio
    if profile.bio:
        parts.append(f"Bio: {profile.bio.strip()}")

    # 3. User skills / technologies if loaded via user relationship
    if user:
        if hasattr(user, "skills") and user.skills:
            skill_names = [s.name for s in user.skills if hasattr(s, "name")]
            if skill_names:
                parts.append(f"Skills: {', '.join(skill_names)}")
        if hasattr(user, "user_technologies") and user.user_technologies:
            tech_names = [t.name for t in user.user_technologies if hasattr(t, "name")]
            if tech_names:
                parts.append(f"Technologies: {', '.join(tech_names)}")

    # 4. Optional social links (only if show_social_links is True)
    if profile.show_social_links:
        socials = []
        if profile.github_url:
            socials.append(f"GitHub: {profile.github_url}")
        if profile.linkedin_url:
            socials.append(f"LinkedIn: {profile.linkedin_url}")
        if socials:
            parts.append(f"Social: {', '.join(socials)}")

    return "\n".join(parts) if parts else None


def build_project_text(project: Project) -> Optional[str]:
    """Build deterministic text representation for a Project."""
    if not project or not project.title:
        return None

    parts = [f"Project Title: {project.title.strip()}"]

    if project.project_type:
        p_type = project.project_type.value if hasattr(project.project_type, "value") else str(project.project_type)
        parts.append(f"Type: {p_type}")

    if project.status:
        p_status = project.status.value if hasattr(project.status, "value") else str(project.status)
        parts.append(f"Status: {p_status}")

    if project.description:
        parts.append(f"Description: {project.description.strip()}")

    if hasattr(project, "technologies") and project.technologies:
        tech_names = [t.name if hasattr(t, "name") else str(t) for t in project.technologies]
        if tech_names:
            parts.append(f"Technologies: {', '.join(tech_names)}")

    if hasattr(project, "project_skills") and project.project_skills:
        skill_names = [ps.skill.name for ps in project.project_skills if hasattr(ps, "skill") and ps.skill]
        if skill_names:
            parts.append(f"Skills: {', '.join(skill_names)}")

    return "\n".join(parts)


def build_research_text(research: ResearchItem) -> Optional[str]:
    """Build deterministic text representation for a Research Item."""
    if not research or not research.title:
        return None

    parts = [f"Research Title: {research.title.strip()}"]

    if research.research_area:
        parts.append(f"Area: {research.research_area.strip()}")

    if research.publication_type:
        pub_type = research.publication_type.value if hasattr(research.publication_type, "value") else str(research.publication_type)
        parts.append(f"Publication Type: {pub_type}")

    if research.publication_venue:
        parts.append(f"Venue: {research.publication_venue.strip()}")

    if research.abstract:
        parts.append(f"Abstract: {research.abstract.strip()}")

    if hasattr(research, "technologies") and research.technologies:
        tech_names = [t.name if hasattr(t, "name") else str(t) for t in research.technologies]
        if tech_names:
            parts.append(f"Technologies: {', '.join(tech_names)}")

    if hasattr(research, "authors") and research.authors:
        author_names = [a.user.profile.full_name for a in research.authors if hasattr(a, "user") and a.user and hasattr(a.user, "profile") and a.user.profile]
        if author_names:
            parts.append(f"Authors: {', '.join(author_names)}")

    return "\n".join(parts)


def build_facility_text(facility: Facility) -> Optional[str]:
    """Build deterministic text representation for a Facility."""
    if not facility or not facility.name:
        return None

    parts = [f"Facility Name: {facility.name.strip()}"]

    if facility.department:
        parts.append(f"Department: {facility.department.strip()}")

    if facility.location:
        parts.append(f"Location: {facility.location.strip()}")

    if facility.description:
        parts.append(f"Description: {facility.description.strip()}")

    if getattr(facility, "capabilities", None):
        parts.append(f"Capabilities: {facility.capabilities.strip()}")

    if facility.operating_hours:
        parts.append(f"Operating Hours: {facility.operating_hours.strip()}")

    if hasattr(facility, "equipment") and facility.equipment:
        eq_details = []
        for e in facility.equipment:
            if hasattr(e, "name") and e.name:
                eq_str = e.name
                if getattr(e, "capability", None):
                    eq_str += f" ({e.capability})"
                eq_details.append(eq_str)
        if eq_details:
            parts.append(f"Equipment Available: {', '.join(eq_details)}")

    return "\n".join(parts)


def build_equipment_text(equipment: Equipment) -> Optional[str]:
    """Build deterministic text representation for Equipment."""
    if not equipment or not equipment.name:
        return None

    parts = [f"Equipment Name: {equipment.name.strip()}"]

    if equipment.category:
        parts.append(f"Category: {equipment.category.strip()}")

    if equipment.availability_status:
        status_val = equipment.availability_status.value if hasattr(equipment.availability_status, "value") else str(equipment.availability_status)
        parts.append(f"Availability: {status_val}")

    if equipment.description:
        parts.append(f"Description: {equipment.description.strip()}")

    if getattr(equipment, "capability", None):
        parts.append(f"Capability: {equipment.capability.strip()}")

    if hasattr(equipment, "facility") and equipment.facility and hasattr(equipment.facility, "name"):
        fac_info = equipment.facility.name
        if getattr(equipment.facility, "department", None):
            fac_info += f" ({equipment.facility.department})"
        if getattr(equipment.facility, "capabilities", None):
            fac_info += f" - {equipment.facility.capabilities}"
        parts.append(f"Facility: {fac_info}")

    return "\n".join(parts)


def build_problem_solution_text(ps: ProblemSolution) -> Optional[str]:
    """Build deterministic text representation for a Problem/Solution record."""
    if not ps or not ps.title:
        return None

    parts = [f"Problem Title: {ps.title.strip()}"]

    if ps.domain:
        parts.append(f"Domain: {ps.domain.strip()}")

    if ps.problem:
        parts.append(f"Problem Statement: {ps.problem.strip()}")

    if ps.symptoms:
        parts.append(f"Symptoms & Context: {ps.symptoms.strip()}")

    if ps.root_cause:
        parts.append(f"Root Cause: {ps.root_cause.strip()}")

    if ps.solution:
        parts.append(f"Solution: {ps.solution.strip()}")

    if ps.outcome:
        parts.append(f"Outcome: {ps.outcome.strip()}")

    if ps.lessons_learned:
        parts.append(f"Lessons Learned: {ps.lessons_learned.strip()}")

    if hasattr(ps, "ps_technologies") and ps.ps_technologies:
        tech_names = [t.name if hasattr(t, "name") else str(t) for t in ps.ps_technologies]
        if tech_names:
            parts.append(f"Technologies: {', '.join(tech_names)}")
    elif hasattr(ps, "technologies") and ps.technologies:
        if isinstance(ps.technologies, list):
            tech_names = [t.name if hasattr(t, "name") else str(t) for t in ps.technologies]
            if tech_names:
                parts.append(f"Technologies: {', '.join(tech_names)}")

    return "\n".join(parts)
