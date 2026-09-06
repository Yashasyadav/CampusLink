import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.models.feedback import FeedbackType


class FeedbackSubmitRequest(BaseModel):
    """Schema for submitting or updating recommendation feedback."""

    feedback_type: FeedbackType = Field(..., description="Structured feedback category")
    comment: Optional[str] = Field(None, max_length=1000, description="Optional text feedback or reason")


class FeedbackResponse(BaseModel):
    """Schema returning persisted recommendation feedback record."""

    id: uuid.UUID
    recommendation_event_id: uuid.UUID
    user_id: uuid.UUID
    feedback_type: FeedbackType
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecommendationEventResponse(BaseModel):
    """Schema returning recommendation event metadata."""

    id: uuid.UUID
    request_id: str
    user_id: uuid.UUID
    query: str
    entity_type: str
    entity_id: uuid.UUID
    rank_position: int
    relevance_score: float
    evidence_quality_score: float
    explanation_generated: Optional[str] = None
    graph_run_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EntityTypeMetrics(BaseModel):
    """Quality metrics grouped by entity type."""

    entity_type: str
    total_recommendations: int = 0
    feedback_count: int = 0
    helpful_count: int = 0
    negative_count: int = 0
    helpful_rate: float = 0.0
    average_relevance: float = 0.0
    average_evidence_quality: float = 0.0


class QualityMetricsResponse(BaseModel):
    """Aggregate recommendation quality and feedback metrics for admin reporting."""

    total_recommendations: int = 0
    total_feedback: int = 0
    helpful_count: int = 0
    negative_count: int = 0
    helpful_rate: float = 0.0
    negative_rate: float = 0.0
    explanation_coverage: float = 0.0
    evidence_quality_avg: float = 0.0
    feedback_coverage: float = 0.0
    average_relevance: float = 0.0
    by_entity_type: List[EntityTypeMetrics] = []


import enum

class QualityFlagEnum(str, enum.Enum):
    LOW_EVIDENCE = "LOW_EVIDENCE"
    NO_EVIDENCE = "NO_EVIDENCE"
    WEAK_SKILL_MATCH = "WEAK_SKILL_MATCH"
    WEAK_TECHNOLOGY_MATCH = "WEAK_TECHNOLOGY_MATCH"
    LOW_SEMANTIC_RELEVANCE = "LOW_SEMANTIC_RELEVANCE"
    NEGATIVE_USER_FEEDBACK = "NEGATIVE_USER_FEEDBACK"
    EXPLANATION_MISSING = "EXPLANATION_MISSING"
    OUTDATED_INFORMATION = "OUTDATED_INFORMATION"


class AdminRecommendationItem(BaseModel):
    """Item schema for administrative recommendation listing."""

    id: uuid.UUID
    request_id: str
    user_id: uuid.UUID
    query: str
    entity_type: str
    entity_id: uuid.UUID
    entity_title: Optional[str] = None
    rank_position: int
    relevance_score: float
    evidence_quality_score: float
    explanation_generated: Optional[str] = None
    feedback_type: Optional[FeedbackType] = None
    feedback_comment: Optional[str] = None
    quality_flags: List[str] = []
    created_at: datetime


class AdminRecommendationDetailResponse(BaseModel):
    """Safe detailed view of a recommendation event for administrative quality auditing."""

    id: uuid.UUID
    request_id: str
    user_id: uuid.UUID
    query: str
    entity_type: str
    entity_id: uuid.UUID
    entity_title: Optional[str] = None
    entity_subtitle: Optional[str] = None
    rank_position: int
    relevance_score: float
    evidence_quality_score: float
    explanation_generated: Optional[str] = None
    score_components: Dict[str, Any] = {}
    supporting_evidence: List[Dict[str, Any]] = []
    quality_flags: List[str] = []
    feedback: Optional[FeedbackResponse] = None
    created_at: datetime
