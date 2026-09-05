import uuid
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.research import PublicationType, ResearchStatus, ResearchVisibility


class ResearchAuthorResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    full_name: Optional[str] = None
    email: Optional[str] = None
    author_order: int

    class Config:
        from_attributes = True


class ResearchCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    abstract: Optional[str] = None
    research_area: Optional[str] = Field(default=None, max_length=150)
    publication_type: PublicationType = Field(default=PublicationType.JOURNAL)
    publication_venue: Optional[str] = Field(default=None, max_length=255)
    publication_date: Optional[date] = None
    doi: Optional[str] = Field(default=None, max_length=100)
    publication_url: Optional[str] = Field(default=None, max_length=512)
    paper_url: Optional[str] = Field(default=None, max_length=512)
    status: ResearchStatus = Field(default=ResearchStatus.PUBLISHED)
    visibility: ResearchVisibility = Field(default=ResearchVisibility.CAMPUS_ONLY)
    author_ids: List[uuid.UUID] = Field(default_factory=list)


class ResearchUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    abstract: Optional[str] = None
    research_area: Optional[str] = None
    publication_type: Optional[PublicationType] = None
    publication_venue: Optional[str] = None
    publication_date: Optional[date] = None
    doi: Optional[str] = None
    publication_url: Optional[str] = None
    paper_url: Optional[str] = None
    status: Optional[ResearchStatus] = None
    visibility: Optional[ResearchVisibility] = None
    author_ids: Optional[List[uuid.UUID]] = None


class ResearchResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    owner_name: Optional[str] = None
    title: str
    abstract: Optional[str] = None
    research_area: Optional[str] = None
    publication_type: PublicationType
    publication_venue: Optional[str] = None
    publication_date: Optional[date] = None
    doi: Optional[str] = None
    publication_url: Optional[str] = None
    paper_url: Optional[str] = None
    status: ResearchStatus
    visibility: ResearchVisibility
    provenance: str
    created_at: datetime
    updated_at: datetime
    authors: List[ResearchAuthorResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
