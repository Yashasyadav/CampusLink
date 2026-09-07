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


def search_people_by_skills_tool(
    db: Any,
    current_user: User,
    skills: List[str],
    technologies: List[str],
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """
    Tool: DB-first structured candidate discovery via UserSkill and ProjectContributor relationships.

    Returns candidate dicts with user_id, display_name, department, matched_skills, searchable.
    Enforces profile.searchable=True and excludes current_user.
    Does NOT perform unrestricted SQL — uses controlled ORM queries only.
    """
    from sqlalchemy import select
    from app.models.skills import UserSkill, Skill
    from app.models.projects import ProjectContributor

    if not skills and not technologies:
        return []

    all_terms = [t.lower().strip() for t in (skills + technologies) if t.strip()]

    # 1. Find users who have matching UserSkill entries
    skill_rows = db.query(UserSkill).all()
    matched_user_ids: set = set()
    matched_reasons: dict = {}

    for us in skill_rows:
        if hasattr(us, "skill") and us.skill and hasattr(us.skill, "name"):
            skill_name_lower = us.skill.name.lower()
            if any(term in skill_name_lower or skill_name_lower in term for term in all_terms):
                if str(us.user_id) != str(current_user.id):
                    matched_user_ids.add(str(us.user_id))
                    matched_reasons.setdefault(str(us.user_id), []).append(us.skill.name)

    # 2. Find users who contribute to projects that match the terms (by project title/description)
    from app.models.projects import ProjectContributor
    contrib_rows = db.query(ProjectContributor).all()
    for c in contrib_rows:
        if str(c.user_id) == str(current_user.id):
            continue
        proj = db.get(Project, c.project_id)
        if not proj:
            continue
        vis = proj.visibility.value if hasattr(proj.visibility, "value") else str(proj.visibility)
        if vis == "PRIVATE" and str(proj.created_by) != str(current_user.id):
            continue
        combined_text = f"{proj.title} {proj.description or ''}".lower()
        if any(term in combined_text for term in all_terms):
            uid = str(c.user_id)
            if uid != str(current_user.id):
                matched_user_ids.add(uid)
                matched_reasons.setdefault(uid, []).append(f"Project: {proj.title}")

    # 3. Find users who authored relevant problem solutions
    from app.models.knowledge import ProblemSolution as PS
    sol_rows = db.query(PS).all()
    for ps in sol_rows:
        if str(ps.author_id) == str(current_user.id):
            continue
        vis = ps.visibility.value if hasattr(ps.visibility, "value") else str(ps.visibility)
        if vis == "PRIVATE" and str(ps.author_id) != str(current_user.id):
            continue
        combined_text = f"{ps.title} {ps.problem or ''} {ps.solution or ''}".lower()
        if any(term in combined_text for term in all_terms):
            uid = str(ps.author_id)
            if uid != str(current_user.id):
                matched_user_ids.add(uid)
                matched_reasons.setdefault(uid, []).append(f"Solution: {ps.title}")

    # 4. Build candidate dicts, enforce profile.searchable=True
    candidates = []
    for uid_str in list(matched_user_ids)[:limit]:
        try:
            uid = uuid.UUID(uid_str)
        except Exception:
            continue
        from sqlalchemy import select as sa_select2
        profile = db.scalar(sa_select2(Profile).where(Profile.user_id == uid))
        if not profile or not profile.searchable:
            continue


        user_skills = []
        try:
            us_rows = db.query(UserSkill).filter(UserSkill.user_id == uid).all()
            for us in us_rows:
                if hasattr(us, "skill") and us.skill:
                    user_skills.append(us.skill.name)
        except Exception:
            pass

        candidates.append({
            "user_id": str(uid),
            "display_name": profile.full_name,
            "department": profile.department,
            "skills": user_skills,
            "matched_evidence": matched_reasons.get(uid_str, []),
            "searchable": profile.searchable,
            "discovery_method": "DB_SKILL_MATCH",
        })

    logger.info(f"search_people_by_skills_tool: found {len(candidates)} candidates for terms={all_terms[:3]}")
    return candidates


def get_profile_tool(db: Any, current_user: User, user_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    """Tool: Fetch public profile details for a given user ID (by user_id, not profile.id)."""
    from sqlalchemy import select as sa_select
    profile = db.scalar(sa_select(Profile).where(Profile.user_id == user_id))
    if not profile or not profile.searchable:
        return None

    # Fetch user skills directly from UserSkill table
    from app.models.skills import UserSkill
    user_skills = []
    try:
        us_rows = db.query(UserSkill).filter(UserSkill.user_id == user_id).all()
        user_skills = [us.skill.name for us in us_rows if us.skill]
    except Exception as exc:
        logger.warning(f"get_profile_tool: failed to load skills for {user_id}: {exc}")

    return {
        "user_id": profile.user_id,
        "full_name": profile.full_name,
        "department": profile.department,
        "designation": profile.designation,
        "bio": profile.bio,
        "location": profile.location,
        "skills": user_skills,
    }


def _normalize_technologies(entity: Any) -> List[str]:
    """
    Safely extract and normalize technology strings from an entity (Project, ProblemSolution, etc.).
    Never throws TypeError when technologies is None, an empty list, strings, or ORM objects.
    """
    if entity is None:
        return []

    raw = None
    # 1. Prefer relationship objects if available
    if hasattr(entity, "ps_technologies") and getattr(entity, "ps_technologies", None) is not None:
        raw = getattr(entity, "ps_technologies")
    elif hasattr(entity, "project_technologies") and getattr(entity, "project_technologies", None) is not None:
        raw = getattr(entity, "project_technologies")
    elif hasattr(entity, "technologies"):
        raw = getattr(entity, "technologies")

    if not raw:
        return []

    result = []
    if isinstance(raw, (list, tuple, set)):
        for item in raw:
            if item is None:
                continue
            if isinstance(item, str):
                name = item.strip()
            elif hasattr(item, "name") and getattr(item, "name", None):
                name = str(getattr(item, "name")).strip()
            elif hasattr(item, "technology_name") and getattr(item, "technology_name", None):
                name = str(getattr(item, "technology_name")).strip()
            else:
                name = str(item).strip()
            if name and name not in result:
                result.append(name)
    elif isinstance(raw, str):
        name = raw.strip()
        if name:
            result.append(name)

    return result


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
                techs = _normalize_technologies(proj)
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
                techs = _normalize_technologies(proj)
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
            techs = _normalize_technologies(ps)
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
