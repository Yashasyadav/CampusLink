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


def get_profiles_batch(
    db: Any, current_user: User, user_ids: List[uuid.UUID]
) -> Dict[str, Dict[str, Any]]:
    """Batch-fetch public profile details for multiple user IDs with eager-loaded skills."""
    if not user_ids:
        return {}

    from sqlalchemy import select as sa_select
    from sqlalchemy.orm import joinedload
    from app.models.skills import UserSkill

    seen = set()
    unique_ids = []
    for uid in user_ids:
        if uid and uid not in seen:
            seen.add(uid)
            unique_ids.append(uid)

    if not unique_ids:
        return {}

    profiles = db.scalars(
        sa_select(Profile).where(
            Profile.user_id.in_(unique_ids),
            Profile.searchable == True,
        )
    ).all()

    # Eager load skills for all unique user IDs in one query
    us_rows = (
        db.query(UserSkill)
        .options(joinedload(UserSkill.skill))
        .filter(UserSkill.user_id.in_(unique_ids))
        .all()
    )
    user_skills_map: Dict[str, List[str]] = {str(uid): [] for uid in unique_ids}
    for us in us_rows:
        if hasattr(us, "skill") and us.skill and hasattr(us.skill, "name"):
            uid_key = str(us.user_id)
            if uid_key in user_skills_map:
                user_skills_map[uid_key].append(us.skill.name)

    result: Dict[str, Dict[str, Any]] = {}
    for profile in profiles:
        uid_key = str(profile.user_id)
        result[uid_key] = {
            "user_id": profile.user_id,
            "full_name": profile.full_name,
            "department": profile.department,
            "designation": profile.designation,
            "bio": profile.bio,
            "location": profile.location,
            "skills": user_skills_map.get(uid_key, []),
        }

    return result


def get_profile_tool(db: Any, current_user: User, user_id: uuid.UUID) -> Optional[Dict[str, Any]]:
    """Tool: Fetch public profile details for a given user ID (by user_id, not profile.id)."""
    batch = get_profiles_batch(db, current_user, [user_id])
    return batch.get(str(user_id))


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


def get_person_evidence_graphs_batch(
    db: Any, current_user: User, target_user_ids: List[uuid.UUID]
) -> Dict[str, Dict[str, Any]]:
    """
    Batch-fetch DB-backed contribution and evidence graph for multiple candidate users.
    Performs constant-query batch retrieval to prevent N+1 queries.
    Enforces identical visibility rules and returns identical graph structure as get_person_evidence_graph_tool.
    """
    if not target_user_ids:
        return {}

    from sqlalchemy import or_
    from sqlalchemy.orm import joinedload, selectinload
    from app.models.skills import UserSkill
    from app.models.projects import ProjectContributor, Project
    from app.models.research import ResearchAuthor, ResearchItem
    from app.models.knowledge import ProblemSolution
    from app.models.facilities import Facility

    seen = set()
    unique_ids = []
    for uid in target_user_ids:
        if uid and uid not in seen:
            seen.add(uid)
            unique_ids.append(uid)

    if not unique_ids:
        return {}

    # Initialize container for each user
    result: Dict[str, Dict[str, Any]] = {}
    for uid in unique_ids:
        result[str(uid)] = {
            "user_id": str(uid),
            "skills": [],
            "projects": [],
            "solutions": [],
            "research": [],
            "facilities": [],
            "evidence_count": 0,
        }

    # 1. User Skills (batch query with joinedload for Skill)
    us_rows = (
        db.query(UserSkill)
        .options(joinedload(UserSkill.skill))
        .filter(UserSkill.user_id.in_(unique_ids))
        .all()
    )
    for us in us_rows:
        if hasattr(us, "skill") and us.skill and hasattr(us.skill, "name"):
            uid_key = str(us.user_id)
            if uid_key in result:
                result[uid_key]["skills"].append(us.skill.name)

    # 2. Contributed & Owned Projects
    contrib_rows = (
        db.query(ProjectContributor)
        .filter(ProjectContributor.user_id.in_(unique_ids))
        .all()
    )
    contrib_map: Dict[str, List[Any]] = {str(uid): [] for uid in unique_ids}
    contrib_proj_ids = set()
    for c in contrib_rows:
        contrib_map[str(c.user_id)].append(c)
        contrib_proj_ids.add(c.project_id)

    proj_filters = [Project.created_by.in_(unique_ids)]
    if contrib_proj_ids:
        proj_filters.append(Project.id.in_(list(contrib_proj_ids)))

    all_projs = (
        db.query(Project)
        .options(selectinload(Project.technologies))
        .filter(or_(*proj_filters))
        .all()
    )
    projs_by_id = {p.id: p for p in all_projs}
    owned_projs_map: Dict[str, List[Any]] = {str(uid): [] for uid in unique_ids}
    for p in all_projs:
        if p.created_by and str(p.created_by) in owned_projs_map:
            owned_projs_map[str(p.created_by)].append(p)

    for uid in unique_ids:
        uid_key = str(uid)
        seen_proj = set()
        user_projs = []

        # Contributed
        for c in contrib_map.get(uid_key, []):
            proj = projs_by_id.get(c.project_id)
            if proj and proj.id not in seen_proj:
                vis = proj.visibility.value if hasattr(proj.visibility, "value") else str(proj.visibility)
                if vis != "PRIVATE" or proj.created_by == current_user.id or uid == current_user.id:
                    seen_proj.add(proj.id)
                    role_str = c.role.value if hasattr(c.role, "value") else str(c.role)
                    techs = _normalize_technologies(proj)
                    user_projs.append({
                        "project_id": str(proj.id),
                        "title": proj.title,
                        "role": role_str,
                        "snippet": (c.contribution_description or proj.description or "")[:150],
                        "technologies": techs,
                    })

        # Owned
        for proj in owned_projs_map.get(uid_key, []):
            if proj.id not in seen_proj:
                vis = proj.visibility.value if hasattr(proj.visibility, "value") else str(proj.visibility)
                if vis != "PRIVATE" or proj.created_by == current_user.id:
                    seen_proj.add(proj.id)
                    techs = _normalize_technologies(proj)
                    user_projs.append({
                        "project_id": str(proj.id),
                        "title": proj.title,
                        "role": "Owner / Lead",
                        "snippet": (proj.description or "")[:150],
                        "technologies": techs,
                    })

        result[uid_key]["projects"] = user_projs

    # 3. Authored Solutions (batch query with selectinload for ps_technologies)
    sol_rows = (
        db.query(ProblemSolution)
        .options(selectinload(ProblemSolution.ps_technologies))
        .filter(ProblemSolution.author_id.in_(unique_ids))
        .all()
    )
    for ps in sol_rows:
        uid_key = str(ps.author_id)
        if uid_key in result:
            vis = ps.visibility.value if hasattr(ps.visibility, "value") else str(ps.visibility)
            if vis != "PRIVATE" or ps.author_id == current_user.id:
                techs = _normalize_technologies(ps)
                result[uid_key]["solutions"].append({
                    "solution_id": str(ps.id),
                    "title": ps.title,
                    "summary": (ps.solution or ps.outcome or ps.problem or "")[:150],
                    "technologies": techs,
                })

    # 4. Research Publications
    ra_rows = (
        db.query(ResearchAuthor)
        .filter(ResearchAuthor.user_id.in_(unique_ids))
        .all()
    )
    ra_map: Dict[str, List[Any]] = {str(uid): [] for uid in unique_ids}
    ra_item_ids = set()
    for ra in ra_rows:
        ra_map[str(ra.user_id)].append(ra)
        ra_item_ids.add(ra.research_id)

    res_filters = [ResearchItem.owner_id.in_(unique_ids)]
    if ra_item_ids:
        res_filters.append(ResearchItem.id.in_(list(ra_item_ids)))

    all_res = (
        db.query(ResearchItem)
        .filter(or_(*res_filters))
        .all()
    )
    res_by_id = {r.id: r for r in all_res}
    owned_res_map: Dict[str, List[Any]] = {str(uid): [] for uid in unique_ids}
    for r in all_res:
        if r.owner_id and str(r.owner_id) in owned_res_map:
            owned_res_map[str(r.owner_id)].append(r)

    for uid in unique_ids:
        uid_key = str(uid)
        seen_res = set()
        user_res = []

        # Authored
        for ra in ra_map.get(uid_key, []):
            res_item = res_by_id.get(ra.research_id)
            if res_item and res_item.id not in seen_res:
                vis = res_item.visibility.value if hasattr(res_item.visibility, "value") else str(res_item.visibility)
                if vis != "PRIVATE" or res_item.owner_id == current_user.id or uid == current_user.id:
                    seen_res.add(res_item.id)
                    pub_str = res_item.publication_type.value if hasattr(res_item.publication_type, "value") else str(res_item.publication_type)
                    user_res.append({
                        "research_id": str(res_item.id),
                        "title": res_item.title,
                        "publication_type": pub_str,
                        "abstract": (res_item.abstract or "")[:150],
                    })

        # Owned
        for res_item in owned_res_map.get(uid_key, []):
            if res_item.id not in seen_res:
                vis = res_item.visibility.value if hasattr(res_item.visibility, "value") else str(res_item.visibility)
                if vis != "PRIVATE" or res_item.owner_id == current_user.id:
                    seen_res.add(res_item.id)
                    pub_str = res_item.publication_type.value if hasattr(res_item.publication_type, "value") else str(res_item.publication_type)
                    user_res.append({
                        "research_id": str(res_item.id),
                        "title": res_item.title,
                        "publication_type": pub_str,
                        "abstract": (res_item.abstract or "")[:150],
                    })

        result[uid_key]["research"] = user_res

    # 5. Responsible Facilities
    fac_rows = (
        db.query(Facility)
        .filter(Facility.responsible_user_id.in_(unique_ids))
        .all()
    )
    for fac in fac_rows:
        uid_key = str(fac.responsible_user_id)
        if uid_key in result:
            result[uid_key]["facilities"].append({
                "facility_id": str(fac.id),
                "name": fac.name,
                "location": fac.location or fac.department or "",
            })

    # Compute evidence_count
    for uid in unique_ids:
        uid_key = str(uid)
        g = result[uid_key]
        g["evidence_count"] = (
            len(g["skills"])
            + len(g["projects"])
            + len(g["solutions"])
            + len(g["research"])
            + len(g["facilities"])
        )

    return result


def get_person_evidence_graph_tool(db: Any, current_user: User, target_user_id: uuid.UUID) -> Dict[str, Any]:
    """Tool: Fetch DB-backed contribution and evidence graph for a candidate user."""
    graphs = get_person_evidence_graphs_batch(db, current_user, [target_user_id])
    return graphs.get(
        str(target_user_id),
        {
            "user_id": str(target_user_id),
            "skills": [],
            "projects": [],
            "solutions": [],
            "research": [],
            "facilities": [],
            "evidence_count": 0,
        },
    )


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
