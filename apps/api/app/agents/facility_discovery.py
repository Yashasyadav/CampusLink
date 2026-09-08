import logging
from typing import Optional, List, Dict, Any
from app.models.users import User
from app.agent_tools.tools import search_facilities_tool, search_equipment_tool
from app.schemas.agents import (
    FacilityDiscoveryResult,
    Evidence,
    QueryUnderstandingResult,
)
from app.services.llm_provider import get_llm_provider, LLMProvider

logger = logging.getLogger(__name__)


class FacilityDiscoveryAgent:
    """Specialized investigator agent for discovering campus facilities, labs, and equipment."""

    def __init__(self, provider: Optional[LLMProvider] = None):
        self.provider = provider or get_llm_provider()

    def discover(
        self,
        db: Any,
        current_user: User,
        query_understanding: QueryUnderstandingResult,
        limit: int = 5,
    ) -> FacilityDiscoveryResult:
        """Find facilities and equipment backed by Phase 6 search evidence + equipment parent resolution + relational matching."""
        from app.models.facilities import Facility, Equipment

        candidate_pool_limit = max(limit * 2, 10)
        facilities_list: List[Dict[str, Any]] = []
        equipment_list: List[Dict[str, Any]] = []
        evidence_list: List[Evidence] = []
        seen_fac_ids = set()
        seen_eq_ids = set()

        # Build retrieval queries incorporating resource_needs and technologies
        search_queries = [query_understanding.original_query]
        for rn in (query_understanding.resource_needs or []):
            if rn and rn.strip() and rn.strip() not in search_queries:
                search_queries.append(rn.strip())
        if query_understanding.technologies:
            tech_q = " ".join(query_understanding.technologies)
            if tech_q not in search_queries:
                search_queries.append(tech_q)

        try:
            # 1. Search Facilities across query dimensions
            for q_term in search_queries[:3]:
                fac_res = search_facilities_tool(db, current_user, q_term, limit=candidate_pool_limit)
                for item in fac_res.results:
                    fid_str = str(item.entity_id)
                    if fid_str not in seen_fac_ids:
                        seen_fac_ids.add(fid_str)
                        facilities_list.append({
                            "id": fid_str,
                            "name": item.title,
                            "snippet": item.snippet,
                            "score": item.score,
                            "metadata": item.metadata,
                        })
                        evidence_list.append(Evidence(
                            entity_type="FACILITY",
                            entity_id=item.entity_id,
                            title=item.title,
                            source="search_facilities_tool",
                            snippet=item.snippet,
                            score=item.score,
                        ))

            # 2. Search Equipment across query dimensions & resolve parent facilities
            for q_term in search_queries[:3]:
                eq_res = search_equipment_tool(db, current_user, q_term, limit=candidate_pool_limit)
                for item in eq_res.results:
                    eid_str = str(item.entity_id)
                    if eid_str not in seen_eq_ids:
                        seen_eq_ids.add(eid_str)
                        equipment_list.append({
                            "id": eid_str,
                            "name": item.title,
                            "snippet": item.snippet,
                            "score": item.score,
                            "metadata": item.metadata,
                        })
                        evidence_list.append(Evidence(
                            entity_type="EQUIPMENT",
                            entity_id=item.entity_id,
                            title=item.title,
                            source="search_equipment_tool",
                            snippet=item.snippet,
                            score=item.score,
                        ))

                    # Resolve parent Facility from discovered equipment
                    try:
                        eq_record = db.get(Equipment, item.entity_id)
                        if eq_record and eq_record.facility:
                            parent_fac = eq_record.facility
                            pf_id_str = str(parent_fac.id)
                            if pf_id_str not in seen_fac_ids:
                                seen_fac_ids.add(pf_id_str)
                                parent_eq_names = [e.name for e in parent_fac.equipment] if parent_fac.equipment else []
                                facilities_list.append({
                                    "id": pf_id_str,
                                    "name": parent_fac.name,
                                    "snippet": parent_fac.description or parent_fac.capabilities or f"Facility containing {item.title}",
                                    "score": max(item.score, 0.50),
                                    "metadata": {
                                        "department": parent_fac.department,
                                        "location": parent_fac.location,
                                        "operating_hours": parent_fac.operating_hours,
                                        "equipment": parent_eq_names,
                                        "matched_equipment": item.title,
                                    },
                                })
                    except Exception as parent_exc:
                        logger.debug(f"Could not resolve parent facility for equipment {item.entity_id}: {parent_exc}")

            # 3. Direct DB relational matching across resource_needs, technologies, and keywords
            dim_terms = [t.lower().strip() for t in (
                (query_understanding.resource_needs or []) +
                (query_understanding.technologies or []) +
                (query_understanding.problem_keywords or [])
            ) if len(t.strip()) > 2]

            if dim_terms:
                all_facs = db.query(Facility).all()
                for fac in all_facs:
                    fid_str = str(fac.id)
                    if fid_str in seen_fac_ids:
                        continue
                    fac_text = f"{fac.name} {fac.description or ''} {fac.capabilities or ''} {fac.department or ''}".lower()
                    matching_eq = [e.name for e in fac.equipment if any(term in e.name.lower() or term in (e.description or '').lower() or term in (e.capability or '').lower() for term in dim_terms)] if fac.equipment else []
                    
                    if any(term in fac_text for term in dim_terms) or matching_eq:
                        seen_fac_ids.add(fid_str)
                        all_eq_names = [e.name for e in fac.equipment] if fac.equipment else []
                        facilities_list.append({
                            "id": fid_str,
                            "name": fac.name,
                            "snippet": fac.description or fac.capabilities or f"Specialized laboratory: {fac.name}",
                            "score": 0.60,
                            "metadata": {
                                "department": fac.department,
                                "location": fac.location,
                                "operating_hours": fac.operating_hours,
                                "equipment": all_eq_names,
                                "matched_equipment": matching_eq,
                            },
                        })

            # Sort by score descending
            facilities_list.sort(key=lambda x: float(x.get("score") or 0.0), reverse=True)
            equipment_list.sort(key=lambda x: float(x.get("score") or 0.0), reverse=True)

            return FacilityDiscoveryResult(
                facilities=facilities_list[:candidate_pool_limit],
                equipment=equipment_list[:candidate_pool_limit],
                evidence=evidence_list,
                status="SUCCESS",
            )

        except Exception as exc:
            logger.error(f"Facility discovery agent error: {exc}", exc_info=True)
            return FacilityDiscoveryResult(
                facilities=[], equipment=[], evidence=[], status="FAILED"
            )
