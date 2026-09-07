import logging
from typing import Optional, List, Any
from app.models.users import User
from app.agent_tools.tools import (
    search_people_tool,
    get_profile_tool,
    get_person_evidence_graph_tool,
    search_people_by_skills_tool,
)
from app.schemas.agents import (
    PeopleDiscoveryResult,
    PeopleCandidate,
    Evidence,
    QueryUnderstandingResult,
)
from app.services.llm_provider import get_llm_provider, LLMProvider
import uuid

logger = logging.getLogger(__name__)


class PeopleDiscoveryAgent:
    """Specialized investigator agent for discovering evidence-backed campus people."""

    def __init__(self, provider: Optional[LLMProvider] = None):
        self.provider = provider or get_llm_provider()

    def discover(
        self,
        db: Any,
        current_user: User,
        query_understanding: QueryUnderstandingResult,
        limit: int = 5,
    ) -> PeopleDiscoveryResult:
        """Find people candidates backed by Phase 6 search evidence + DB-first structured discovery."""
        query = query_understanding.original_query
        q_skills = query_understanding.skills or []
        q_tech = query_understanding.technologies or []

        try:
            # 1. Semantic / hybrid vector search
            search_res = search_people_tool(db, current_user, query, limit=limit)
            semantic_results = search_res.results

            # 2. DB-first fallback: always run if semantic results < limit
            #    This ensures discovery even when profile embeddings are missing or low-scoring
            db_candidates: List[dict] = []
            if len(semantic_results) < limit:
                db_candidates = search_people_by_skills_tool(
                    db=db,
                    current_user=current_user,
                    skills=q_skills,
                    technologies=q_tech,
                    limit=limit * 2,  # fetch more to allow deduplication
                )
                logger.info(
                    f"PeopleDiscoveryAgent: semantic={len(semantic_results)}, DB-fallback={len(db_candidates)}"
                )

            # 3. Build a combined deduplicated candidate list
            #    Prefer semantic results first; fill with DB candidates
            seen_user_ids: set = set()

            # Add semantic results
            combined_items = []
            for item in semantic_results:
                uid_str = str(item.entity_id)
                if uid_str == str(current_user.id):
                    continue
                if uid_str not in seen_user_ids:
                    seen_user_ids.add(uid_str)
                    combined_items.append(("SEMANTIC", item, None))

            # Add DB-first candidates not already found by semantic search
            for db_cand in db_candidates:
                uid_str = str(db_cand.get("user_id", ""))
                if uid_str == str(current_user.id):
                    continue
                if uid_str and uid_str not in seen_user_ids:
                    seen_user_ids.add(uid_str)
                    combined_items.append(("DB", None, db_cand))

            # 4. Process each candidate into PeopleCandidate
            candidates: List[PeopleCandidate] = []

            for source, semantic_item, db_item in combined_items[:limit]:
                try:
                    if source == "SEMANTIC":
                        entity_id = semantic_item.entity_id
                        raw_score = semantic_item.score
                        snippet = semantic_item.snippet
                    else:
                        # DB-first candidate
                        try:
                            entity_id = uuid.UUID(str(db_item["user_id"]))
                        except Exception:
                            continue
                        raw_score = 0.40  # structural match baseline score
                        snippet = f"Matched via skills/projects: {', '.join(db_item.get('matched_evidence', [])[:2])}"

                    # Strict self-exclusion
                    if str(entity_id) == str(current_user.id):
                        continue

                    # Get profile details
                    profile_info = get_profile_tool(db, current_user, entity_id)
                    if not profile_info:
                        continue
                    if str(profile_info.get("user_id")) == str(current_user.id):
                        continue

                    # Get structured DB evidence graph
                    ev_graph = get_person_evidence_graph_tool(db, current_user, entity_id)

                    # Combine skills and text for matching
                    graph_skills = [s.lower() for s in ev_graph.get("skills", [])]
                    graph_techs = []
                    for p in ev_graph.get("projects", []):
                        graph_techs.extend([t.lower() for t in p.get("technologies", [])])
                    for s in ev_graph.get("solutions", []):
                        graph_techs.extend([t.lower() for t in s.get("technologies", [])])

                    profile_skills = [s.lower() for s in profile_info.get("skills", [])] + graph_skills
                    profile_text = f"{profile_info.get('bio') or ''} {' '.join(profile_skills)} {' '.join(graph_techs)}".lower()

                    # Match query skills
                    matched_skills = [
                        s for s in q_skills
                        if s.lower() in profile_skills or s.lower() in profile_text
                    ]
                    if not matched_skills and profile_skills:
                        matched_skills = [profile_info.get("skills", [])[0]] if profile_info.get("skills") else []

                    # Match query technologies
                    matched_tech = [
                        t for t in q_tech
                        if t.lower() in profile_skills or t.lower() in graph_techs or t.lower() in profile_text
                    ]

                    evidence_item = Evidence(
                        entity_type="PROFILE",
                        entity_id=entity_id,
                        title=profile_info["full_name"],
                        source=f"search_people_tool:{source}",
                        snippet=snippet,
                        score=raw_score,
                    )

                    candidate = PeopleCandidate(
                        user_id=profile_info["user_id"],
                        display_name=profile_info["full_name"],
                        department=profile_info.get("department"),
                        matched_skills=list(dict.fromkeys(matched_skills)),
                        matched_technologies=list(dict.fromkeys(matched_tech)),
                        evidence=[evidence_item],
                        person_evidence_graph=ev_graph,
                        evidence_count=ev_graph.get("evidence_count", 0),
                    )
                    candidates.append(candidate)
                except Exception as cand_exc:
                    logger.warning(
                        f"PeopleDiscoveryAgent: candidate error for entity_id={entity_id if 'entity_id' in locals() else 'unknown'}: {cand_exc}"
                    )
                    continue

            summary = f"Discovered {len(candidates)} evidence-backed people candidates (semantic={sum(1 for s,_,_ in combined_items if s=='SEMANTIC')}, db={sum(1 for s,_,_ in combined_items if s=='DB')})."
            logger.info(f"PeopleDiscoveryAgent: {summary}")
            return PeopleDiscoveryResult(
                candidates=candidates, status="SUCCESS", summary=summary
            )

        except Exception as exc:
            logger.error(f"People discovery agent error: {exc}", exc_info=True)
            return PeopleDiscoveryResult(
                candidates=[], status="FAILED", summary=f"People discovery error: {str(exc)}"
            )
