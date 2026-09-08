import time
import uuid
import logging
from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel
from sqlalchemy import select, and_, or_, func, text
from sqlalchemy.orm import Session

from app.models.embeddings import Embedding
from app.models.profiles import Profile
from app.models.projects import Project
from app.models.research import ResearchItem
from app.models.facilities import Facility, Equipment
from app.models.knowledge import ProblemSolution
from app.models.users import User

from app.services.embedding_provider import get_embedding_provider, EmbeddingProvider

logger = logging.getLogger(__name__)


class SearchResultItem(BaseModel):
    entity_type: str
    entity_id: uuid.UUID
    title: str
    snippet: str
    score: float
    matched_fields: List[str] = []
    metadata: Dict[str, Any] = {}


class SearchResponse(BaseModel):
    query: str
    mode: str
    total: int
    results: List[SearchResultItem]
    duration_ms: float


class SearchService:
    """Service performing pgvector semantic search, PostgreSQL lexical search, and hybrid ranking."""

    def __init__(self, provider: Optional[EmbeddingProvider] = None):
        self.provider = provider or get_embedding_provider()

    def search(
        self,
        db: Session,
        query: str,
        entity_types: Optional[List[str]] = None,
        mode: str = "HYBRID",
        limit: int = 10,
        offset: int = 0,
        user: Optional[User] = None,
        semantic_weight: float = 0.7,
        lexical_weight: float = 0.3,
    ) -> SearchResponse:
        """
        Execute campus knowledge search.
        Supported modes: SEMANTIC, HYBRID.
        Enforces visibility and authorization boundaries before returning results.
        """
        start_time = time.time()
        if not query or not query.strip():
            return SearchResponse(
                query=query, mode=mode, total=0, results=[], duration_ms=0.0
            )

        clean_query = query.strip()
        allowed_entity_types = entity_types or [
            "PROFILE",
            "PROJECT",
            "RESEARCH",
            "FACILITY",
            "EQUIPMENT",
            "PROBLEM_SOLUTION",
        ]

        # 1. Perform retrieval based on mode
        if mode.upper() == "SEMANTIC":
            candidate_map = self._semantic_search(db, clean_query, allowed_entity_types, limit * 3, user)
        else:  # HYBRID
            sem_map = self._semantic_search(db, clean_query, allowed_entity_types, limit * 3, user)
            lex_map = self._lexical_search(db, clean_query, allowed_entity_types, limit * 3, user)
            candidate_map = self._combine_hybrid_scores(sem_map, lex_map, semantic_weight, lexical_weight)

        # 2. Filter, hydrate, and rank final results
        ranked_items = self._hydrate_and_filter_results(db, candidate_map, user)

        # 3. Sort by score descending and apply pagination
        ranked_items.sort(key=lambda x: x.score, reverse=True)
        paginated_results = ranked_items[offset : offset + limit]

        duration_ms = round((time.time() - start_time) * 1000, 2)
        return SearchResponse(
            query=clean_query,
            mode=mode.upper(),
            total=len(ranked_items),
            results=paginated_results,
            duration_ms=duration_ms,
        )

    def _semantic_search(
        self,
        db: Session,
        query: str,
        allowed_entity_types: List[str],
        limit: int,
        user: Optional[User],
    ) -> Dict[Tuple[str, uuid.UUID], float]:
        """pgvector similarity search returning {(entity_type, entity_id): semantic_score}."""
        query_vector = self.provider.embed_text(query)
        if not query_vector:
            return {}

        # Query pgvector using cosine distance operator <=>
        stmt = (
            select(
                Embedding.entity_type,
                Embedding.entity_id,
                Embedding.chunk_text,
                Embedding.embedding.cosine_distance(query_vector).label("distance"),
            )
            .where(Embedding.entity_type.in_(allowed_entity_types))
            .order_by("distance")
            .limit(limit)
        )

        results = db.execute(stmt).all()
        scores: Dict[Tuple[str, uuid.UUID], float] = {}

        for row in results:
            etype, eid, ctext, dist = row.entity_type, row.entity_id, row.chunk_text, row.distance
            # Convert cosine distance to similarity score in [0.0, 1.0]
            sim_score = max(0.0, min(1.0, 1.0 - float(dist or 0.0)))
            key = (etype, eid)
            # Keep highest chunk score for each entity
            if key not in scores or sim_score > scores[key]:
                scores[key] = sim_score

        return scores

    def _lexical_search(
        self,
        db: Session,
        query: str,
        allowed_entity_types: List[str],
        limit: int,
        user: Optional[User],
    ) -> Dict[Tuple[str, uuid.UUID], float]:
        """PostgreSQL Full-Text Search (tsvector/tsquery) lexical matching."""
        scores: Dict[Tuple[str, uuid.UUID], float] = {}
        
        # Clean terms for plain tsquery / ILIKE matching
        terms = [t for t in query.split() if len(t) > 2]
        if not terms:
            terms = [query]

        # Use ILIKE & tsvector pattern
        conditions = [Embedding.chunk_text.ilike(f"%{term}%") for term in terms]
        stmt = (
            select(
                Embedding.entity_type,
                Embedding.entity_id,
                Embedding.chunk_text,
            )
            .where(
                and_(
                    Embedding.entity_type.in_(allowed_entity_types),
                    or_(*conditions),
                )
            )
            .limit(limit)
        )

        results = db.execute(stmt).all()
        for row in results:
            etype, eid, ctext = row.entity_type, row.entity_id, row.chunk_text
            # Calculate simple lexical matching score based on term frequencies
            match_count = sum(1 for term in terms if term.lower() in ctext.lower())
            lex_score = min(1.0, match_count / len(terms))
            key = (etype, eid)
            if key not in scores or lex_score > scores[key]:
                scores[key] = lex_score

        return scores

    def _combine_hybrid_scores(
        self,
        sem_map: Dict[Tuple[str, uuid.UUID], float],
        lex_map: Dict[Tuple[str, uuid.UUID], float],
        sem_weight: float,
        lex_weight: float,
    ) -> Dict[Tuple[str, uuid.UUID], float]:
        """Combine semantic and lexical candidate scores using configurable weights."""
        all_keys = set(sem_map.keys()).union(set(lex_map.keys()))
        combined: Dict[Tuple[str, uuid.UUID], float] = {}

        for key in all_keys:
            s_score = sem_map.get(key, 0.0)
            l_score = lex_map.get(key, 0.0)
            final_score = (sem_weight * s_score) + (lex_weight * l_score)
            combined[key] = round(final_score, 4)

        return combined

    def _hydrate_and_filter_results(
        self,
        db: Session,
        candidate_map: Dict[Tuple[str, uuid.UUID], float],
        user: Optional[User],
    ) -> List[SearchResultItem]:
        """Hydrate candidate entities with title/snippets and enforce strict visibility controls."""
        items: List[SearchResultItem] = []

        for (etype, eid), score in candidate_map.items():
            if score <= 0.01:
                continue

            item = self._hydrate_entity(db, etype, eid, score, user)
            if item is not None:
                items.append(item)

        return items

    def _hydrate_entity(
        self,
        db: Session,
        entity_type: str,
        entity_id: uuid.UUID,
        score: float,
        user: Optional[User],
    ) -> Optional[SearchResultItem]:
        """
        Fetch entity record, verify visibility/permission authorization,
        and format public SearchResultItem.
        """
        user_id = user.id if user else None

        if entity_type == "PROFILE":
            # PROFILE embeddings are indexed by user_id, not profile.id
            # Must query by user_id, not by profile.id (the Base PK)
            from sqlalchemy import select as sa_select
            profile = db.scalar(sa_select(Profile).where(Profile.user_id == entity_id))
            if not profile or not profile.searchable:
                return None  # Exclude non-searchable profiles

            return SearchResultItem(
                entity_type="PROFILE",
                entity_id=entity_id,
                title=profile.full_name,
                snippet=profile.bio[:200] if profile.bio else f"{profile.department or 'Campus Member'}",
                score=score,
                matched_fields=["profile"],
                metadata={
                    "department": profile.department,
                    "designation": profile.designation,
                    "location": profile.location,
                    "user_id": str(entity_id),
                },
            )

        elif entity_type == "PROJECT":
            proj = db.get(Project, entity_id)
            if not proj:
                return None

            # Visibility enforcement
            vis = proj.visibility.value if hasattr(proj.visibility, "value") else str(proj.visibility)
            if vis == "PRIVATE":
                # Private project accessible ONLY if user is owner/creator
                creator_id = getattr(proj, "created_by", None) or getattr(proj, "owner_id", None)
                if not user_id or creator_id != user_id:
                    return None

            tech_list = []
            if hasattr(proj, "technologies") and proj.technologies:
                for t in proj.technologies:
                    if hasattr(t, "name") and t.name:
                        tech_list.append(t.name)
                    elif hasattr(t, "technology_name") and t.technology_name:
                        tech_list.append(t.technology_name)
                    elif isinstance(t, str):
                        tech_list.append(t)
            contributors_list = []
            if hasattr(proj, "contributors") and proj.contributors:
                for c in proj.contributors:
                    if c.user and hasattr(c.user, "profile") and c.user.profile and c.user.profile.searchable:
                        contributors_list.append(c.user.profile.full_name)

            return SearchResultItem(
                entity_type="PROJECT",
                entity_id=entity_id,
                title=proj.title,
                snippet=proj.description[:200] if proj.description else "",
                score=score,
                metadata={
                    "status": proj.status.value if hasattr(proj.status, "value") else str(proj.status),
                    "project_type": proj.project_type.value if hasattr(proj.project_type, "value") else str(proj.project_type),
                    "visibility": vis,
                    "technologies": tech_list,
                    "contributors": contributors_list,
                },
            )

        elif entity_type == "RESEARCH":
            res = db.get(ResearchItem, entity_id)
            if not res:
                return None

            vis = res.visibility.value if hasattr(res.visibility, "value") else str(res.visibility)
            if vis == "PRIVATE":
                creator_id = getattr(res, "created_by", None) or getattr(res, "created_by_id", None)
                if not user_id or creator_id != user_id:
                    return None

            authors_list = []
            if hasattr(res, "authors") and res.authors:
                for a in res.authors:
                    if a.user and hasattr(a.user, "profile") and a.user.profile and a.user.profile.searchable:
                        authors_list.append(a.user.profile.full_name)

            return SearchResultItem(
                entity_type="RESEARCH",
                entity_id=entity_id,
                title=res.title,
                snippet=res.abstract[:200] if res.abstract else "",
                score=score,
                metadata={
                    "research_area": res.research_area,
                    "publication_type": res.publication_type.value if hasattr(res.publication_type, "value") else str(res.publication_type),
                    "visibility": vis,
                    "authors": authors_list,
                },
            )

        elif entity_type == "FACILITY":
            from sqlalchemy.orm import joinedload
            fac = (
                db.query(Facility)
                .options(
                    joinedload(Facility.equipment),
                    joinedload(Facility.responsible_user).joinedload(User.profile),
                )
                .filter(Facility.id == entity_id)
                .first()
            )
            if not fac:
                return None

            vis = fac.visibility.value if hasattr(fac.visibility, "value") else str(fac.visibility)
            if vis == "PRIVATE":
                return None

            eq_names = [e.name for e in fac.equipment] if hasattr(fac, "equipment") and fac.equipment else []
            resp_name = None
            if hasattr(fac, "responsible_user") and fac.responsible_user and hasattr(fac.responsible_user, "profile") and fac.responsible_user.profile and fac.responsible_user.profile.searchable:
                resp_name = fac.responsible_user.profile.full_name

            return SearchResultItem(
                entity_type="FACILITY",
                entity_id=entity_id,
                title=fac.name,
                snippet=fac.description[:200] if fac.description else f"{fac.department or ''} Facility",
                score=score,
                metadata={
                    "department": fac.department,
                    "location": fac.location,
                    "operating_hours": fac.operating_hours,
                    "equipment": eq_names,
                    "responsible_user": resp_name,
                },
            )

        elif entity_type == "EQUIPMENT":
            eq = db.get(Equipment, entity_id)
            if not eq:
                return None

            vis = eq.visibility.value if hasattr(eq.visibility, "value") else str(eq.visibility)
            if vis == "PRIVATE":
                return None

            return SearchResultItem(
                entity_type="EQUIPMENT",
                entity_id=entity_id,
                title=eq.name,
                snippet=eq.description[:200] if eq.description else f"{eq.category or 'Equipment'}",
                score=score,
                metadata={
                    "category": eq.category,
                    "status": eq.availability_status.value if hasattr(eq.availability_status, "value") else str(eq.availability_status),
                },
            )

        elif entity_type == "PROBLEM_SOLUTION":
            ps = db.get(ProblemSolution, entity_id)
            if not ps:
                return None

            vis = ps.visibility.value if hasattr(ps.visibility, "value") else str(ps.visibility)
            if vis == "PRIVATE":
                if not user_id or ps.author_id != user_id:
                    return None

            return SearchResultItem(
                entity_type="PROBLEM_SOLUTION",
                entity_id=entity_id,
                title=ps.title,
                snippet=ps.solution[:200] if ps.solution else (ps.problem[:200] if ps.problem else ""),
                score=score,
                metadata={
                    "domain": ps.domain,
                    "status": ps.status.value if hasattr(ps.status, "value") else str(ps.status),
                    "visibility": vis,
                },
            )

        return None
