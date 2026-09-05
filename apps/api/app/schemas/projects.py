import uuid
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.projects import ProjectType, ProjectVisibility, ProjectStatus, ContributorRole


class ProjectContributorCreate(BaseModel):
    user_id: uuid.UUID
    role: ContributorRole = Field(default=ContributorRole.CONTRIBUTOR)
    contribution_description: Optional[str] = None


class ProjectContributorResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: ContributorRole
    contribution_description: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectSkillResponse(BaseModel):
    skill_id: uuid.UUID
    name: str
    category: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectTechnologyResponse(BaseModel):
    name: str
    normalized_name: str
    category: Optional[str] = None

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=5)
    project_type: ProjectType = Field(default=ProjectType.ACADEMIC)
    domain: Optional[str] = Field(default=None, max_length=100)
    problem_statement: Optional[str] = None
    methodology: Optional[str] = None
    outcome: Optional[str] = None
    visibility: ProjectVisibility = Field(default=ProjectVisibility.CAMPUS_ONLY)
    status: ProjectStatus = Field(default=ProjectStatus.IN_PROGRESS)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    github_url: Optional[str] = Field(default=None, max_length=512)
    demo_url: Optional[str] = Field(default=None, max_length=512)
    paper_url: Optional[str] = Field(default=None, max_length=512)
    video_url: Optional[str] = Field(default=None, max_length=512)
    skills: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    contributors: List[ProjectContributorCreate] = Field(default_factory=list)


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    description: Optional[str] = None
    project_type: Optional[ProjectType] = None
    domain: Optional[str] = None
    problem_statement: Optional[str] = None
    methodology: Optional[str] = None
    outcome: Optional[str] = None
    visibility: Optional[ProjectVisibility] = None
    status: Optional[ProjectStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    paper_url: Optional[str] = None
    video_url: Optional[str] = None
    skills: Optional[List[str]] = None
    technologies: Optional[List[str]] = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    description: str
    project_type: ProjectType
    domain: Optional[str] = None
    problem_statement: Optional[str] = None
    methodology: Optional[str] = None
    outcome: Optional[str] = None
    visibility: ProjectVisibility
    status: ProjectStatus
    provenance: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    paper_url: Optional[str] = None
    video_url: Optional[str] = None
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    creator_name: Optional[str] = None
    skills: List[ProjectSkillResponse] = Field(default_factory=list)
    technologies: List[ProjectTechnologyResponse] = Field(default_factory=list)
    contributors: List[ProjectContributorResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
