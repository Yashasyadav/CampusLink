import uuid
import logging
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recommendation import RecommendationEvent
from app.models.feedback import RecommendationFeedback, FeedbackType
from app.models.users import User
from app.repositories.recommendation_repository import RecommendationRepository
from app.schemas.feedback import (
    FeedbackSubmitRequest,
    FeedbackResponse,
    RecommendationEventResponse,
    QualityMetricsResponse,
    AdminRecommendationItem,
    AdminRecommendationDetailResponse,
    QualityFlagEnum,
)

logger = logging.getLogger(__name__)


class RecommendationQualityService:
    """
    Central service for persisting surfaced recommendations, recording user feedback,
    evaluating deterministic quality flags, and computing audit metrics.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = RecommendationRepository(db)

    async def record_surfaced_recommendations(
        self,
        request_id: str,
        user_id: uuid.UUID,
        query: str,
        top_people: List[Dict[str, Any]],
        top_projects: List[Dict[str, Any]],
        top_solutions: List[Dict[str, Any]] = None,
        top_facilities: List[Dict[str, Any]] = None,
    ) -> List[RecommendationEvent]:
        """
        Record recommendation events ONLY for candidates actually surfaced to the user.
        Injects generated recommendation_event_id into candidates for direct frontend feedback targeting.
        """
        events: List[RecommendationEvent] = []
        now = datetime.now(timezone.utc)

        # 1. Process People
        for idx, item in enumerate(top_people):
            cand_id = item.get("candidate_id") or item.get("user_id")
            if not cand_id:
                continue
            try:
                e_uuid = uuid.UUID(str(cand_id))
            except ValueError:
                continue

            event_id = uuid.uuid4()
            item["recommendation_event_id"] = str(event_id)
            item["recommendation_id"] = str(event_id)

            ev_score = 0.85 if item.get("supporting_evidence") or item.get("evidence_strength") == "STRONG" else 0.50
            events.append(
                RecommendationEvent(
                    id=event_id,
                    request_id=request_id,
                    user_id=user_id,
                    query=query.strip(),
                    entity_type="PROFILE",
                    entity_id=e_uuid,
                    rank_position=idx + 1,
                    relevance_score=float(item.get("relevance_score", 0.85)),
                    evidence_quality_score=float(ev_score),
                    explanation_generated=item.get("explanation"),
                    created_at=now,
                )
            )

        # 2. Process Projects
        for idx, item in enumerate(top_projects):
            cand_id = item.get("candidate_id") or item.get("id") or item.get("project_id")
            if not cand_id:
                continue
            try:
                e_uuid = uuid.UUID(str(cand_id))
            except ValueError:
                continue

            event_id = uuid.uuid4()
            item["recommendation_event_id"] = str(event_id)
            item["recommendation_id"] = str(event_id)

            ev_score = 0.80 if item.get("supporting_evidence") or item.get("evidence_strength") == "STRONG" else 0.50
            events.append(
                RecommendationEvent(
                    id=event_id,
                    request_id=request_id,
                    user_id=user_id,
                    query=query.strip(),
                    entity_type="PROJECT",
                    entity_id=e_uuid,
                    rank_position=idx + 1,
                    relevance_score=float(item.get("relevance_score", 0.80)),
                    evidence_quality_score=float(ev_score),
                    explanation_generated=item.get("explanation"),
                    created_at=now,
                )
            )

        # 3. Process Solutions (if present)
        if top_solutions:
            for idx, item in enumerate(top_solutions):
                cand_id = item.get("candidate_id") or item.get("id")
                if not cand_id:
                    continue
                try:
                    e_uuid = uuid.UUID(str(cand_id))
                except ValueError:
                    continue

                event_id = uuid.uuid4()
                item["recommendation_event_id"] = str(event_id)
                item["recommendation_id"] = str(event_id)

                events.append(
                    RecommendationEvent(
                        id=event_id,
                        request_id=request_id,
                        user_id=user_id,
                        query=query.strip(),
                        entity_type="PROBLEM_SOLUTION",
                        entity_id=e_uuid,
                        rank_position=idx + 1,
                        relevance_score=float(item.get("relevance_score", 0.75)),
                        evidence_quality_score=0.75,
                        explanation_generated=item.get("explanation"),
                        created_at=now,
                    )
                )

        if events:
            await self.repo.create_recommendation_events(events)

        return events

    def record_surfaced_recommendations_sync(
        self,
        request_id: str,
        user_id: uuid.UUID,
        query: str,
        top_people: List[Dict[str, Any]],
        top_projects: List[Dict[str, Any]],
        top_solutions: List[Dict[str, Any]] = None,
        top_facilities: List[Dict[str, Any]] = None,
    ) -> List[RecommendationEvent]:
        """Synchronous version for GraphExecutionService when running inside DB sync greenlet."""
        events: List[RecommendationEvent] = []
        now = datetime.now(timezone.utc)

        # 1. Process People
        for idx, item in enumerate(top_people):
            cand_id = item.get("candidate_id") or item.get("user_id")
            if not cand_id:
                continue
            try:
                e_uuid = uuid.UUID(str(cand_id))
            except ValueError:
                continue

            event_id = uuid.uuid4()
            item["recommendation_event_id"] = str(event_id)
            item["recommendation_id"] = str(event_id)

            ev_score = 0.85 if item.get("supporting_evidence") or item.get("evidence_strength") == "STRONG" else 0.50
            events.append(
                RecommendationEvent(
                    id=event_id,
                    request_id=request_id,
                    user_id=user_id,
                    query=query.strip(),
                    entity_type="PROFILE",
                    entity_id=e_uuid,
                    rank_position=idx + 1,
                    relevance_score=float(item.get("relevance_score", 0.85)),
                    evidence_quality_score=float(ev_score),
                    explanation_generated=item.get("explanation"),
                    created_at=now,
                )
            )

        # 2. Process Projects
        for idx, item in enumerate(top_projects):
            cand_id = item.get("candidate_id") or item.get("id") or item.get("project_id")
            if not cand_id:
                continue
            try:
                e_uuid = uuid.UUID(str(cand_id))
            except ValueError:
                continue

            event_id = uuid.uuid4()
            item["recommendation_event_id"] = str(event_id)
            item["recommendation_id"] = str(event_id)

            ev_score = 0.80 if item.get("supporting_evidence") or item.get("evidence_strength") == "STRONG" else 0.50
            events.append(
                RecommendationEvent(
                    id=event_id,
                    request_id=request_id,
                    user_id=user_id,
                    query=query.strip(),
                    entity_type="PROJECT",
                    entity_id=e_uuid,
                    rank_position=idx + 1,
                    relevance_score=float(item.get("relevance_score", 0.80)),
                    evidence_quality_score=float(ev_score),
                    explanation_generated=item.get("explanation"),
                    created_at=now,
                )
            )

        if events:
            self.repo.create_recommendation_events_sync(events)

        return events

    async def submit_feedback(
        self,
        current_user: User,
        recommendation_id: uuid.UUID,
        payload: FeedbackSubmitRequest,
    ) -> FeedbackResponse:
        """
        Record or update feedback for a recommendation event.
        Enforces server-side IDOR ownership checks: event MUST belong to current_user.
        """
        event = await self.repo.get_event_by_id_and_user(recommendation_id, current_user.id)
        if not event:
            # Check if event exists at all to distinguish between 404 and 403
            any_event = await self.repo.get_event_by_id(recommendation_id)
            if any_event:
                raise ValueError("IDOR_VIOLATION: Recommendation event belongs to another user.")
            raise KeyError("RECOMMENDATION_NOT_FOUND: Recommendation event does not exist.")

        fb = await self.repo.upsert_feedback(
            recommendation_event_id=recommendation_id,
            user_id=current_user.id,
            feedback_type=payload.feedback_type,
            comment=payload.comment,
        )
        return FeedbackResponse.model_validate(fb)

    async def get_user_feedback(
        self, current_user: User, recommendation_id: uuid.UUID
    ) -> Optional[FeedbackResponse]:
        """Fetch feedback submitted by user for a recommendation."""
        event = await self.repo.get_event_by_id(recommendation_id)
        if not event:
            raise KeyError("RECOMMENDATION_NOT_FOUND: Recommendation event does not exist.")
        if str(event.user_id) != str(current_user.id):
            raise ValueError("IDOR_VIOLATION: Recommendation event belongs to another user.")
        fb = await self.repo.get_feedback_for_event_and_user(recommendation_id, current_user.id)
        return FeedbackResponse.model_validate(fb) if fb else None

    async def get_admin_metrics(self) -> QualityMetricsResponse:
        """Fetch aggregate recommendation quality metrics."""
        raw = await self.repo.compute_aggregate_metrics()
        return QualityMetricsResponse.model_validate(raw)

    def evaluate_quality_flags(
        self,
        event: RecommendationEvent,
        feedback: Optional[RecommendationFeedback] = None,
    ) -> List[str]:
        """Evaluates deterministic quality flags for auditing."""
        flags: List[str] = []

        if event.evidence_quality_score < 0.40:
            flags.append(QualityFlagEnum.NO_EVIDENCE)
        elif event.evidence_quality_score < 0.70:
            flags.append(QualityFlagEnum.LOW_EVIDENCE)

        if event.relevance_score < 0.60:
            flags.append(QualityFlagEnum.LOW_SEMANTIC_RELEVANCE)

        if not event.explanation_generated or not event.explanation_generated.strip():
            flags.append(QualityFlagEnum.EXPLANATION_MISSING)

        if feedback:
            if feedback.feedback_type in [
                FeedbackType.NOT_HELPFUL,
                FeedbackType.WRONG_MATCH,
                FeedbackType.OUTDATED,
                FeedbackType.INSUFFICIENT_EVIDENCE,
            ]:
                flags.append(QualityFlagEnum.NEGATIVE_USER_FEEDBACK)
            if feedback.feedback_type == FeedbackType.OUTDATED:
                flags.append(QualityFlagEnum.OUTDATED_INFORMATION)

        return flags

    async def list_admin_recommendations(
        self,
        limit: int = 50,
        offset: int = 0,
        entity_type: Optional[str] = None,
        has_feedback: Optional[bool] = None,
    ) -> Tuple[List[AdminRecommendationItem], int]:
        """List recommendation events with title resolution and quality flags for administrative audit."""
        items, total = await self.repo.list_recommendation_events(
            limit=limit, offset=offset, entity_type_filter=entity_type, has_feedback_filter=has_feedback
        )

        res: List[AdminRecommendationItem] = []
        for event, fb in items:
            title, _ = await self.repo.resolve_entity_title(event.entity_type, event.entity_id)
            flags = self.evaluate_quality_flags(event, fb)

            res.append(
                AdminRecommendationItem(
                    id=event.id,
                    request_id=event.request_id,
                    user_id=event.user_id,
                    query=event.query,
                    entity_type=event.entity_type,
                    entity_id=event.entity_id,
                    entity_title=title or f"{event.entity_type} {str(event.entity_id)[:8]}",
                    rank_position=event.rank_position,
                    relevance_score=event.relevance_score,
                    evidence_quality_score=event.evidence_quality_score,
                    explanation_generated=event.explanation_generated,
                    feedback_type=fb.feedback_type if fb else None,
                    feedback_comment=fb.optional_comment if fb else None,
                    quality_flags=flags,
                    created_at=event.created_at,
                )
            )

        return res, total

    async def get_admin_recommendation_detail(
        self, event_id: uuid.UUID
    ) -> AdminRecommendationDetailResponse:
        """Fetch safe administrative detail view of a recommendation event."""
        event = await self.repo.get_event_by_id(event_id)
        if not event:
            raise KeyError("RECOMMENDATION_NOT_FOUND: Recommendation event does not exist.")

        fb = await self.repo.get_feedback_for_event_and_user(event.id, event.user_id)
        title, subtitle = await self.repo.resolve_entity_title(event.entity_type, event.entity_id)
        flags = self.evaluate_quality_flags(event, fb)

        score_components = {
            "relevance_score": event.relevance_score,
            "evidence_quality_score": event.evidence_quality_score,
            "rank_position": event.rank_position,
        }

        supporting_evidence = [
            {
                "entity_type": event.entity_type,
                "entity_id": str(event.entity_id),
                "title": title or "Surfaced Asset",
                "source": "surfaced_recommendation_event",
                "quality_score": event.evidence_quality_score,
            }
        ]

        fb_schema = FeedbackResponse.model_validate(fb) if fb else None

        return AdminRecommendationDetailResponse(
            id=event.id,
            request_id=event.request_id,
            user_id=event.user_id,
            query=event.query,
            entity_type=event.entity_type,
            entity_id=event.entity_id,
            entity_title=title or f"{event.entity_type} {str(event.entity_id)[:8]}",
            entity_subtitle=subtitle or "Campus Asset",
            rank_position=event.rank_position,
            relevance_score=event.relevance_score,
            evidence_quality_score=event.evidence_quality_score,
            explanation_generated=event.explanation_generated,
            score_components=score_components,
            supporting_evidence=supporting_evidence,
            quality_flags=flags,
            feedback=fb_schema,
            created_at=event.created_at,
        )
