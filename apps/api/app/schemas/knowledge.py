import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.knowledge import KnowledgeVisibility, ProblemSolutionStatus


class ProblemSolutionSkillResponse(BaseModel):
    skill_id: uuid.UUID
    name: str

    class Config:
        from_attributes = True


class ProblemSolutionTechResponse(BaseModel):
    name: str
    normalized_name: str

    class Config:
        from_attributes = True


class ProblemSolutionCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    problem: str = Field(..., min_length=5)
    symptoms: Optional[str] = None
    root_cause: Optional[str] = None
    solution: str = Field(..., min_length=5)
    outcome: Optional[str] = None
    lessons_learned: Optional[str] = None
    domain: Optional[str] = Field(default=None, max_length=100)
    project_id: Optional[uuid.UUID] = None
    research_id: Optional[uuid.UUID] = None
    status: ProblemSolutionStatus = Field(default=ProblemSolutionStatus.PUBLISHED)
    visibility: KnowledgeVisibility = Field(default=KnowledgeVisibility.CAMPUS_ONLY)
    skills: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)


class ProblemSolutionUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    problem: Optional[str] = None
    symptoms: Optional[str] = None
    root_cause: Optional[str] = None
    solution: Optional[str] = None
    outcome: Optional[str] = None
    lessons_learned: Optional[str] = None
    domain: Optional[str] = None
    project_id: Optional[uuid.UUID] = None
    research_id: Optional[uuid.UUID] = None
    status: Optional[ProblemSolutionStatus] = None
    visibility: Optional[KnowledgeVisibility] = None
    skills: Optional[List[str]] = None
    technologies: Optional[List[str]] = None


class ProblemSolutionResponse(BaseModel):
    id: uuid.UUID
    author_id: Optional[uuid.UUID] = None
    author_name: Optional[str] = None
    project_id: Optional[uuid.UUID] = None
    project_title: Optional[str] = None
    research_id: Optional[uuid.UUID] = None
    research_title: Optional[str] = None
    title: str
    problem: str
    symptoms: Optional[str] = None
    root_cause: Optional[str] = None
    solution: str
    outcome: Optional[str] = None
    lessons_learned: Optional[str] = None
    domain: Optional[str] = None
    status: ProblemSolutionStatus
    visibility: KnowledgeVisibility
    provenance: str
    created_at: datetime
    updated_at: datetime
    skills: List[ProblemSolutionSkillResponse] = Field(default_factory=list)
    technologies: List[ProblemSolutionTechResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
