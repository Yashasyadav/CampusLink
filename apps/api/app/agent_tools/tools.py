"""
Controlled Tool Layer for Phase 7 Specialized Discovery Agents.
Agents interact ONLY with these controlled tools.
Direct SQL execution, ORM sessions, or raw storage access are strictly forbidden.
All tools enforce user-level authorization and Phase 6 visibility filters.
"""

import uuid
import logging
from typing import List, Dict, Any, Optional
from app.models.users import User
from app.models.profiles import Profile
from app.models.projects import Project
from app.models.research import ResearchItem
from app.models.facilities import Facility, Equipment
from app.models.knowledge import ProblemSolution

from app.services.search_service import SearchService, SearchResponse
from app.schemas.agents import Evidence

logger = logging.getLogger(__name__)
search_service = SearchService()


def search_people_tool(
    db: Any, current_user: User, query: str, limit: int = 5
) -> SearchResponse:
    """Tool: Search campus user profiles using Phase 6 semantic & hybrid retrieval."""
    return search_service.search(
        db=db,
        query=query,
        entity_types=["PROFILE"],
        mode="HYBRID",
        limit=limit,
        user=current_user,
    )


def get_profile_tool(db: Any, current_user: User, user_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    """Tool: Fetch public profile details for a given user ID."""
    profile = db.get(Profile, user_id)
    if not profile or not profile.searchable:
        return None

    return {
        "user_id": profile.user_id,
        "full_name": profile.full_name,
        "department": profile.department,
        "designation": profile.designation,
        "bio": profile.bio,
        "location": profile.location,
    }


def search_projects_tool(
    db: Any, current_user: User, query: str, limit: int = 5
) -> SearchResponse:
    """Tool: Search campus projects using Phase 6 semantic & hybrid retrieval."""
    return search_service.search(
        db=db,
        query=query,
        entity_types=["PROJECT"],
        mode="HYBRID",
        limit=limit,
        user=current_user,
    )


def get_project_tool(db: Any, current_user: User, project_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    """Tool: Fetch project details enforcing visibility rules."""
    proj = db.get(Project, project_id)
    if not proj:
        return None

    vis = proj.visibility.value if hasattr(proj.visibility, "value") else str(proj.visibility)
    if vis == "PRIVATE" and proj.owner_id != current_user.id:
        return None

    return {
        "id": proj.id,
        "title": proj.title,
        "description": proj.description,
        "domain": proj.domain,
        "status": proj.status.value if hasattr(proj.status, "value") else str(proj.status),
        "visibility": vis,
    }


def search_research_tool(
    db: Any, current_user: User, query: str, limit: int = 5
) -> SearchResponse:
    """Tool: Search campus research papers and items using Phase 6 retrieval."""
    return search_service.search(
        db=db,
        query=query,
        entity_types=["RESEARCH"],
        mode="HYBRID",
        limit=limit,
        user=current_user,
    )


def get_research_tool(db: Any, current_user: User, research_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    """Tool: Fetch research item details enforcing visibility rules."""
    res = db.get(ResearchItem, research_id)
    if not res:
        return None

    vis = res.visibility.value if hasattr(res.visibility, "value") else str(res.visibility)
    if vis == "PRIVATE" and res.created_by_id != current_user.id:
        return None

    return {
        "id": res.id,
        "title": res.title,
        "abstract": res.abstract,
        "research_area": res.research_area,
        "visibility": vis,
    }


def search_solutions_tool(
    db: Any, current_user: User, query: str, limit: int = 5
) -> SearchResponse:
    """Tool: Search problem/solution institutional knowledge records."""
    return search_service.search(
        db=db,
        query=query,
        entity_types=["PROBLEM_SOLUTION"],
        mode="HYBRID",
        limit=limit,
        user=current_user,
    )


def get_solution_tool(db: Any, current_user: User, solution_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    """Tool: Fetch problem/solution details enforcing visibility rules."""
    ps = db.get(ProblemSolution, solution_id)
    if not ps:
        return None

    vis = ps.visibility.value if hasattr(ps.visibility, "value") else str(ps.visibility)
    if vis == "PRIVATE" and ps.author_id != current_user.id:
        return None

    return {
        "id": ps.id,
        "title": ps.title,
        "problem": ps.problem,
        "solution": ps.solution,
        "outcome": ps.outcome,
        "domain": ps.domain,
        "visibility": vis,
    }


def search_facilities_tool(
    db: Any, current_user: User, query: str, limit: int = 5
) -> SearchResponse:
    """Tool: Search campus hardware labs and facilities."""
    return search_service.search(
        db=db,
        query=query,
        entity_types=["FACILITY"],
        mode="HYBRID",
        limit=limit,
        user=current_user,
    )


def get_facility_tool(db: Any, current_user: User, facility_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    """Tool: Fetch facility details."""
    fac = db.get(Facility, facility_id)
    if not fac:
        return None

    return {
        "id": fac.id,
        "name": fac.name,
        "department": fac.department,
        "location": fac.location,
        "description": fac.description,
        "operating_hours": fac.operating_hours,
    }


def search_equipment_tool(
    db: Any, current_user: User, query: str, limit: int = 5
) -> SearchResponse:
    """Tool: Search campus equipment and instruments."""
    return search_service.search(
        db=db,
        query=query,
        entity_types=["EQUIPMENT"],
        mode="HYBRID",
        limit=limit,
        user=current_user,
    )


def get_equipment_tool(db: Any, current_user: User, equipment_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    """Tool: Fetch equipment details."""
    eq = db.get(Equipment, equipment_id)
    if not eq:
        return None

    return {
        "id": eq.id,
        "name": eq.name,
        "category": eq.category,
        "status": eq.availability_status.value if hasattr(eq.availability_status, "value") else str(eq.availability_status),
        "description": eq.description,
    }
