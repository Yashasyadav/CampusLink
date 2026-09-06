import uuid
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SearchMode(str, Enum):
    SEMANTIC = "SEMANTIC"
    HYBRID = "HYBRID"


class EntityTypeFilter(str, Enum):
    PROFILE = "PROFILE"
    SKILL = "SKILL"
    PROJECT = "PROJECT"
    RESEARCH = "RESEARCH"
    FACILITY = "FACILITY"
    EQUIPMENT = "EQUIPMENT"
    PROBLEM_SOLUTION = "PROBLEM_SOLUTION"


class SearchQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500, description="Natural language search query")
    entity_types: Optional[List[EntityTypeFilter]] = Field(
        default=None, description="Optional entity types filter"
    )
    mode: SearchMode = Field(default=SearchMode.HYBRID, description="Search execution mode")
    limit: int = Field(default=10, ge=1, le=50, description="Maximum results to return")
    offset: int = Field(default=0, ge=0, description="Pagination offset")


class SearchResultItemSchema(BaseModel):
    entity_type: str = Field(..., description="Entity type identifier")
    entity_id: uuid.UUID = Field(..., description="Entity unique ID")
    title: str = Field(..., description="Entity title or display name")
    snippet: str = Field(..., description="Relevant content snippet")
    score: float = Field(..., description="Normalized similarity or hybrid relevance score")
    matched_fields: List[str] = Field(default=[], description="List of matched attribute fields")
    metadata: Dict[str, Any] = Field(default={}, description="Public metadata attributes")


class SearchQueryResponse(BaseModel):
    query: str
    mode: SearchMode
    total: int
    results: List[SearchResultItemSchema]
    duration_ms: float


class ReindexRequest(BaseModel):
    entity_types: Optional[List[EntityTypeFilter]] = Field(default=None)
    entity_id: Optional[uuid.UUID] = Field(default=None)


class ReindexResponse(BaseModel):
    status: str
    total_records: int
    indexed_records: int
    skipped_records: int
    failed_records: int
    duration_seconds: float
    embedding_model: str
    errors: List[str] = []
