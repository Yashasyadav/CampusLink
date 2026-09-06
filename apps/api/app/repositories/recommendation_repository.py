import uuid
import logging
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import select, func, and_, or_, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.recommendation import RecommendationEvent
from app.models.feedback import RecommendationFeedback, FeedbackType
from app.models.users import User
from app.models.profiles import Profile
from app.models.projects import Project
from app.models.research import ResearchItem
from app.models.facilities import Facility, Equipment
from app.models.knowledge import ProblemSolution

logger = logging.getLogger(__name__)


class RecommendationRepository:
    """Repository handling database operations for recommendation events and feedback."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_recommendation_events(
        self, events: List[RecommendationEvent]
    ) -> List[RecommendationEvent]:
        """Batch save surfaced recommendation events."""
        if not events:
            return []
        self.db.add_all(events)
        await self.db.flush()
        return events

    def create_recommendation_events_sync(
        self, events: List[RecommendationEvent]
    ) -> List[RecommendationEvent]:
        """Batch save surfaced recommendation events in synchronous DB context."""
        if not events:
            return []
        self.db.add_all(events)
        self.db.flush()
        return events

    async def get_event_by_id(self, event_id: uuid.UUID) -> Optional[RecommendationEvent]:
        """Fetch recommendation event by ID."""
        stmt = (
            select(RecommendationEvent)
            .where(RecommendationEvent.id == event_id)
            .options(selectinload(RecommendationEvent.feedback_records))
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def get_event_by_id_and_user(
        self, event_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[RecommendationEvent]:
        """Fetch recommendation event ensuring ownership for IDOR security enforcement."""
        stmt = (
            select(RecommendationEvent)
            .where(
                and_(
                    RecommendationEvent.id == event_id,
                    RecommendationEvent.user_id == user_id,
                )
            )
            .options(selectinload(RecommendationEvent.feedback_records))
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def upsert_feedback(
        self,
        recommendation_event_id: uuid.UUID,
        user_id: uuid.UUID,
        feedback_type: FeedbackType,
        comment: Optional[str] = None,
    ) -> RecommendationFeedback:
        """Create or update feedback record for a recommendation event owned by user."""
        stmt = select(RecommendationFeedback).where(
            and_(
                RecommendationFeedback.recommendation_event_id == recommendation_event_id,
                RecommendationFeedback.user_id == user_id,
            )
        )
        res = await self.db.execute(stmt)
        existing = res.scalar_one_or_none()

        now = datetime.now(timezone.utc)

        if existing:
            existing.feedback_type = feedback_type
            existing.optional_comment = comment
            existing.updated_at = now
            await self.db.flush()
            return existing
        else:
            fb = RecommendationFeedback(
                id=uuid.uuid4(),
                recommendation_event_id=recommendation_event_id,
                user_id=user_id,
                feedback_type=feedback_type,
                optional_comment=comment,
                created_at=now,
                updated_at=now,
            )
            self.db.add(fb)
            await self.db.flush()
            return fb

    async def get_feedback_for_event_and_user(
        self, recommendation_event_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[RecommendationFeedback]:
        """Fetch existing feedback for a recommendation event by user."""
        stmt = select(RecommendationFeedback).where(
            and_(
                RecommendationFeedback.recommendation_event_id == recommendation_event_id,
                RecommendationFeedback.user_id == user_id,
            )
        )
        res = await self.db.execute(stmt)
        return res.scalar_one_or_none()

    async def list_recommendation_events(
        self,
        limit: int = 50,
        offset: int = 0,
        entity_type_filter: Optional[str] = None,
        has_feedback_filter: Optional[bool] = None,
    ) -> Tuple[List[Tuple[RecommendationEvent, Optional[RecommendationFeedback]]], int]:
        """List recommendation events and attached feedback for administrative quality review."""
        base_query = select(RecommendationEvent, RecommendationFeedback).outerjoin(
            RecommendationFeedback,
            and_(
                RecommendationFeedback.recommendation_event_id == RecommendationEvent.id,
                RecommendationFeedback.user_id == RecommendationEvent.user_id,
            ),
        )

        count_query = select(func.count(RecommendationEvent.id))

        if entity_type_filter:
            base_query = base_query.where(RecommendationEvent.entity_type == entity_type_filter)
            count_query = count_query.where(RecommendationEvent.entity_type == entity_type_filter)

        if has_feedback_filter is True:
            base_query = base_query.where(RecommendationFeedback.id.isnot(None))
            count_query = count_query.where(
                select(RecommendationFeedback.id)
                .where(RecommendationFeedback.recommendation_event_id == RecommendationEvent.id)
                .exists()
            )
        elif has_feedback_filter is False:
            base_query = base_query.where(RecommendationFeedback.id.is_none())
            count_query = count_query.where(
                ~select(RecommendationFeedback.id)
                .where(RecommendationFeedback.recommendation_event_id == RecommendationEvent.id)
                .exists()
            )

        total_res = await self.db.execute(count_query)
        total = total_res.scalar() or 0

        stmt = base_query.order_by(RecommendationEvent.created_at.desc()).offset(offset).limit(limit)
        res = await self.db.execute(stmt)
        items = res.all()
        return [(r.RecommendationEvent, r.RecommendationFeedback) for r in items], total

    async def compute_aggregate_metrics(self) -> Dict[str, Any]:
        """Compute recommendation quality metrics cleanly via SQL queries."""
        # 1. Total recommendations
        tot_stmt = select(func.count(RecommendationEvent.id))
        tot_res = await self.db.execute(tot_stmt)
        total_recommendations = tot_res.scalar() or 0

        # 2. Total feedback count
        fb_stmt = select(func.count(RecommendationFeedback.id))
        fb_res = await self.db.execute(fb_stmt)
        total_feedback = fb_res.scalar() or 0

        # 3. Helpful vs Negative counts
        helpful_types = [FeedbackType.HELPFUL, FeedbackType.PARTIALLY_HELPFUL]
        negative_types = [FeedbackType.NOT_HELPFUL, FeedbackType.WRONG_MATCH, FeedbackType.OUTDATED, FeedbackType.INSUFFICIENT_EVIDENCE]

        h_stmt = select(func.count(RecommendationFeedback.id)).where(RecommendationFeedback.feedback_type.in_(helpful_types))
        h_res = await self.db.execute(h_stmt)
        helpful_count = h_res.scalar() or 0

        n_stmt = select(func.count(RecommendationFeedback.id)).where(RecommendationFeedback.feedback_type.in_(negative_types))
        n_res = await self.db.execute(n_stmt)
        negative_count = n_res.scalar() or 0

        # 4. Explanation coverage
        exp_stmt = select(func.count(RecommendationEvent.id)).where(
            and_(RecommendationEvent.explanation_generated.isnot(None), RecommendationEvent.explanation_generated != "")
        )
        exp_res = await self.db.execute(exp_stmt)
        exp_count = exp_res.scalar() or 0

        # 5. Averages
        avg_stmt = select(
            func.avg(RecommendationEvent.relevance_score),
            func.avg(RecommendationEvent.evidence_quality_score),
        )
        avg_res = await self.db.execute(avg_stmt)
        avg_rel, avg_ev = avg_res.one_or_none() or (0.0, 0.0)

        # 6. Grouped by entity type
        grp_stmt = (
            select(
                RecommendationEvent.entity_type,
                func.count(RecommendationEvent.id).label("total"),
                func.avg(RecommendationEvent.relevance_score).label("avg_rel"),
                func.avg(RecommendationEvent.evidence_quality_score).label("avg_ev"),
            )
            .group_by(RecommendationEvent.entity_type)
        )
        grp_res = await self.db.execute(grp_stmt)
        by_entity = grp_res.all()

        helpful_rate = round(helpful_count / total_feedback, 4) if total_feedback > 0 else 0.0
        negative_rate = round(negative_count / total_feedback, 4) if total_feedback > 0 else 0.0
        explanation_coverage = round(exp_count / total_recommendations, 4) if total_recommendations > 0 else 0.0
        feedback_coverage = round(total_feedback / total_recommendations, 4) if total_recommendations > 0 else 0.0

        entity_metrics = []
        for row in by_entity:
            etype = row.entity_type
            # Count feedback for entity type
            et_fb_stmt = select(func.count(RecommendationFeedback.id)).join(
                RecommendationEvent, RecommendationFeedback.recommendation_event_id == RecommendationEvent.id
            ).where(RecommendationEvent.entity_type == etype)
            et_fb_res = await self.db.execute(et_fb_stmt)
            et_fb_cnt = et_fb_res.scalar() or 0

            et_h_stmt = select(func.count(RecommendationFeedback.id)).join(
                RecommendationEvent, RecommendationFeedback.recommendation_event_id == RecommendationEvent.id
            ).where(and_(RecommendationEvent.entity_type == etype, RecommendationFeedback.feedback_type.in_(helpful_types)))
            et_h_res = await self.db.execute(et_h_stmt)
            et_h_cnt = et_h_res.scalar() or 0

            et_n_stmt = select(func.count(RecommendationFeedback.id)).join(
                RecommendationEvent, RecommendationFeedback.recommendation_event_id == RecommendationEvent.id
            ).where(and_(RecommendationEvent.entity_type == etype, RecommendationFeedback.feedback_type.in_(negative_types)))
            et_n_res = await self.db.execute(et_n_stmt)
            et_n_cnt = et_n_res.scalar() or 0

            et_h_rate = round(et_h_cnt / et_fb_cnt, 4) if et_fb_cnt > 0 else 0.0

            entity_metrics.append({
                "entity_type": etype,
                "total_recommendations": row.total,
                "feedback_count": et_fb_cnt,
                "helpful_count": et_h_cnt,
                "negative_count": et_n_cnt,
                "helpful_rate": et_h_rate,
                "average_relevance": round(float(row.avg_rel or 0.0), 4),
                "average_evidence_quality": round(float(row.avg_ev or 0.0), 4),
            })

        return {
            "total_recommendations": total_recommendations,
            "total_feedback": total_feedback,
            "helpful_count": helpful_count,
            "negative_count": negative_count,
            "helpful_rate": helpful_rate,
            "negative_rate": negative_rate,
            "explanation_coverage": explanation_coverage,
            "evidence_quality_avg": round(float(avg_ev or 0.0), 4),
            "feedback_coverage": feedback_coverage,
            "average_relevance": round(float(avg_rel or 0.0), 4),
            "by_entity_type": entity_metrics,
        }

    async def resolve_entity_title(self, entity_type: str, entity_id: uuid.UUID) -> Tuple[Optional[str], Optional[str]]:
        """Fetch title and subtitle for an entity cleanly."""
        if entity_type == "PROFILE":
            res = await self.db.execute(select(Profile).where(Profile.id == entity_id))
            p = res.scalar_one_or_none()
            return (p.full_name, p.department) if p else (None, None)
        elif entity_type == "PROJECT":
            res = await self.db.execute(select(Project).where(Project.id == entity_id))
            pr = res.scalar_one_or_none()
            return (pr.title, "Campus Project") if pr else (None, None)
        elif entity_type == "RESEARCH":
            res = await self.db.execute(select(ResearchItem).where(ResearchItem.id == entity_id))
            r = res.scalar_one_or_none()
            return (r.title, r.research_area) if r else (None, None)
        elif entity_type == "FACILITY":
            res = await self.db.execute(select(Facility).where(Facility.id == entity_id))
            f = res.scalar_one_or_none()
            return (f.name, f.department) if f else (None, None)
        elif entity_type == "EQUIPMENT":
            res = await self.db.execute(select(Equipment).where(Equipment.id == entity_id))
            eq = res.scalar_one_or_none()
            return (eq.name, eq.category) if eq else (None, None)
        elif entity_type == "PROBLEM_SOLUTION":
            res = await self.db.execute(select(ProblemSolution).where(ProblemSolution.id == entity_id))
            ps = res.scalar_one_or_none()
            return (ps.title, ps.domain) if ps else (None, None)
        return (None, None)

    async def delete_user_feedback_data(self, user_id: uuid.UUID) -> None:
        """Anonymize or remove feedback data upon account deletion."""
        await self.db.execute(delete(RecommendationFeedback).where(RecommendationFeedback.user_id == user_id))
        await self.db.execute(delete(RecommendationEvent).where(RecommendationEvent.user_id == user_id))
        await self.db.flush()
