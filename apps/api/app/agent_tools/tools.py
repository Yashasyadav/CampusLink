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

    # Fetch user skills from relation
    user_skills = []
    user_obj = db.get(User, user_id)
    if user_obj and hasattr(user_obj, "user_skills") and user_obj.user_skills:
        user_skills = [us.skill.name for us in user_obj.user_skills if us.skill]

    return {
        "user_id": profile.user_id,
        "full_name": profile.full_name,
        "department": profile.department,
        "designation": profile.designation,
        "bio": profile.bio,
        "location": profile.location,
        "skills": user_skills,
    }


def get_person_evidence_graph_tool(db: Any, current_user: User, target_user_id: uuid.UUID) -> Dict[str, Any]:
    """Tool: Fetch DB-backed contribution and evidence graph for a candidate user."""
    from app.models.skills import UserSkill
    from app.models.projects import ProjectContributor, Project
    from app.models.research import ResearchAuthor, ResearchItem
    from app.models.knowledge import ProblemSolution
    from app.models.facilities import Facility

    # 1. User Skills
    user_skills = []
    us_rows = db.query(UserSkill).filter(UserSkill.user_id == target_user_id).all()
    for us in us_rows:
        if hasattr(us, "skill") and us.skill and hasattr(us.skill, "name"):
            user_skills.append(us.skill.name)

    # 2. Contributed & Owned Projects
    projects = []
    seen_proj = set()
    contrib_rows = db.query(ProjectContributor).filter(ProjectContributor.user_id == target_user_id).all()
    for c in contrib_rows:
        proj = db.get(Project, c.project_id)
        if proj and proj.id not in seen_proj:
            vis = proj.visibility.value if hasattr(proj.visibility, "value") else str(proj.visibility)
            if vis != "PRIVATE" or proj.created_by == current_user.id or target_user_id == current_user.id:
                seen_proj.add(proj.id)
                role_str = c.role.value if hasattr(c.role, "value") else str(c.role)
                techs = [t.technology_name for t in getattr(proj, "technologies", [])] if hasattr(proj, "technologies") else []
                projects.append({
                    "project_id": str(proj.id),
                    "title": proj.title,
                    "role": role_str,
                    "snippet": (c.contribution_description or proj.description or "")[:150],
                    "technologies": techs,
                })

    owned_projs = db.query(Project).filter(Project.created_by == target_user_id).all()
    for proj in owned_projs:
        if proj.id not in seen_proj:
            vis = proj.visibility.value if hasattr(proj.visibility, "value") else str(proj.visibility)
            if vis != "PRIVATE" or proj.created_by == current_user.id:
                seen_proj.add(proj.id)
                techs = [t.technology_name for t in getattr(proj, "technologies", [])] if hasattr(proj, "technologies") else []
                projects.append({
                    "project_id": str(proj.id),
                    "title": proj.title,
                    "role": "Owner / Lead",
                    "snippet": (proj.description or "")[:150],
                    "technologies": techs,
                })

    # 3. Authored Solutions
    solutions = []
    sol_rows = db.query(ProblemSolution).filter(ProblemSolution.author_id == target_user_id).all()
    for ps in sol_rows:
        vis = ps.visibility.value if hasattr(ps.visibility, "value") else str(ps.visibility)
        if vis != "PRIVATE" or ps.author_id == current_user.id:
            techs = [t.technology_name for t in getattr(ps, "technologies", [])] if hasattr(ps, "technologies") else []
            solutions.append({
                "solution_id": str(ps.id),
                "title": ps.title,
                "summary": (ps.solution or ps.outcome or ps.problem or "")[:150],
                "technologies": techs,
            })

    # 4. Research Publications
    research = []
    seen_res = set()
    ra_rows = db.query(ResearchAuthor).filter(ResearchAuthor.user_id == target_user_id).all()
    for ra in ra_rows:
        res_item = db.get(ResearchItem, ra.research_id)
        if res_item and res_item.id not in seen_res:
            vis = res_item.visibility.value if hasattr(res_item.visibility, "value") else str(res_item.visibility)
            if vis != "PRIVATE" or res_item.owner_id == current_user.id or target_user_id == current_user.id:
                seen_res.add(res_item.id)
                pub_str = res_item.publication_type.value if hasattr(res_item.publication_type, "value") else str(res_item.publication_type)
                research.append({
                    "research_id": str(res_item.id),
                    "title": res_item.title,
                    "publication_type": pub_str,
                    "abstract": (res_item.abstract or "")[:150],
                })

    owned_res = db.query(ResearchItem).filter(ResearchItem.owner_id == target_user_id).all()
    for res_item in owned_res:
        if res_item.id not in seen_res:
            vis = res_item.visibility.value if hasattr(res_item.visibility, "value") else str(res_item.visibility)
            if vis != "PRIVATE" or res_item.owner_id == current_user.id:
                seen_res.add(res_item.id)
                pub_str = res_item.publication_type.value if hasattr(res_item.publication_type, "value") else str(res_item.publication_type)
                research.append({
                    "research_id": str(res_item.id),
                    "title": res_item.title,
                    "publication_type": pub_str,
                    "abstract": (res_item.abstract or "")[:150],
                })

    # 5. Responsible Facilities
    facilities = []
    fac_rows = db.query(Facility).filter(Facility.responsible_user_id == target_user_id).all()
    for fac in fac_rows:
        facilities.append({
            "facility_id": str(fac.id),
            "name": fac.name,
            "location": fac.location or fac.department or "",
        })

    ev_count = len(user_skills) + len(projects) + len(solutions) + len(research) + len(facilities)

    return {
        "user_id": str(target_user_id),
        "skills": user_skills,
        "projects": projects,
        "solutions": solutions,
        "research": research,
        "facilities": facilities,
        "evidence_count": ev_count,
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
    if vis == "PRIVATE" and res.owner_id != current_user.id:
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
