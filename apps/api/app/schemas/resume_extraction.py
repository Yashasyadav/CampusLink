import enum
from typing import List, Optional
from pydantic import BaseModel, Field


class ProvenanceType(str, enum.Enum):
    EXPLICIT = "EXPLICIT"
    INFERRED = "INFERRED"
    AI_GENERATED = "AI_GENERATED"


class SkillProficiency(str, enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"


class PersonalInformation(BaseModel):
    full_name: Optional[str] = Field(default=None, description="Full name of candidate")
    email: Optional[str] = Field(default=None, description="Email address")
    phone: Optional[str] = Field(default=None, description="Phone number")
    location: Optional[str] = Field(default=None, description="City/State/Country location")
    portfolio_url: Optional[str] = Field(default=None, description="Personal website or portfolio URL")
    github_url: Optional[str] = Field(default=None, description="GitHub profile URL")
    linkedin_url: Optional[str] = Field(default=None, description="LinkedIn profile URL")


class EducationItem(BaseModel):
    institution: str = Field(..., description="University or college name")
    degree: Optional[str] = Field(default=None, description="Degree name (e.g. B.Tech, M.S.)")
    field: Optional[str] = Field(default=None, description="Field of study or major")
    start_year: Optional[int] = Field(default=None, description="Start year")
    end_year: Optional[int] = Field(default=None, description="End or expected graduation year")
    grade: Optional[str] = Field(default=None, description="GPA or percentage grade")


class SkillItem(BaseModel):
    name: str = Field(..., description="Name of skill (e.g. Python, Machine Learning)")
    category: Optional[str] = Field(default=None, description="Category (e.g. Programming, Framework, Domain)")
    proficiency: SkillProficiency = Field(default=SkillProficiency.INTERMEDIATE, description="Proficiency level")
    evidence: Optional[str] = Field(default=None, description="Exact quotation or context from resume")
    confidence: float = Field(default=0.9, ge=0.0, le=1.0, description="Extraction confidence level (0.0 to 1.0)")
    provenance: ProvenanceType = Field(default=ProvenanceType.EXPLICIT, description="Evidence provenance type")


class TechnologyItem(BaseModel):
    name: str = Field(..., description="Name of technology/tool (e.g. Docker, PostgreSQL, ESP32)")
    category: Optional[str] = Field(default=None, description="Category (e.g. Database, Hardware, DevOps)")
    evidence: Optional[str] = Field(default=None, description="Context or quotation from resume")
    confidence: float = Field(default=0.9, ge=0.0, le=1.0, description="Extraction confidence level")
    provenance: ProvenanceType = Field(default=ProvenanceType.EXPLICIT, description="Evidence provenance type")


class ExperienceItem(BaseModel):
    company: str = Field(..., description="Company or organization name")
    role: str = Field(..., description="Job title or role")
    start_date: Optional[str] = Field(default=None, description="Start date (e.g., Jun 2023)")
    end_date: Optional[str] = Field(default=None, description="End date or Present")
    description: Optional[str] = Field(default=None, description="Role summary and responsibilities")
    technologies: List[str] = Field(default_factory=list, description="List of technologies used in role")
    achievements: List[str] = Field(default_factory=list, description="Key achievements in role")


class ProjectItem(BaseModel):
    title: str = Field(..., description="Project title")
    description: Optional[str] = Field(default=None, description="Brief project description")
    problem_statement: Optional[str] = Field(default=None, description="Problem addressed by project")
    technologies: List[str] = Field(default_factory=list, description="Technologies used")
    skills: List[str] = Field(default_factory=list, description="Skills demonstrated")
    outcomes: Optional[str] = Field(default=None, description="Results or achievements of project")
    project_url: Optional[str] = Field(default=None, description="Live demo or website URL")
    repository_url: Optional[str] = Field(default=None, description="Code repository URL (e.g. GitHub)")


class ResearchItem(BaseModel):
    title: str = Field(..., description="Research paper or project title")
    description: Optional[str] = Field(default=None, description="Abstract or research description")
    research_area: Optional[str] = Field(default=None, description="Field of research (e.g. Computer Vision)")
    publication_url: Optional[str] = Field(default=None, description="Publication link or DOI")


class CertificationItem(BaseModel):
    name: str = Field(..., description="Certification name")
    issuer: Optional[str] = Field(default=None, description="Issuing organization (e.g. AWS, Coursera)")
    issue_date: Optional[str] = Field(default=None, description="Issue date")
    credential_url: Optional[str] = Field(default=None, description="Credential verification link")


class AchievementItem(BaseModel):
    title: str = Field(..., description="Title of award, hackathon, or honor")
    description: Optional[str] = Field(default=None, description="Details of achievement")
    issuer: Optional[str] = Field(default=None, description="Awarding body or event name")
    date: Optional[str] = Field(default=None, description="Date awarded")


class InterestItem(BaseModel):
    name: str = Field(..., description="Interest or domain area")
    description: Optional[str] = Field(default=None, description="Details or context")


class Summary(BaseModel):
    generated_summary: Optional[str] = Field(
        default=None, description="AI-generated candidate profile summary"
    )
    is_ai_generated: bool = Field(
        default=True, description="Flag explicitly identifying this summary as AI-generated"
    )


class ResumeExtraction(BaseModel):
    """Complete structured resume extraction payload."""

    personal_information: PersonalInformation = Field(default_factory=PersonalInformation)
    education: List[EducationItem] = Field(default_factory=list)
    skills: List[SkillItem] = Field(default_factory=list)
    technologies: List[TechnologyItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    research: List[ResearchItem] = Field(default_factory=list)
    certifications: List[CertificationItem] = Field(default_factory=list)
    achievements: List[AchievementItem] = Field(default_factory=list)
    interests: List[InterestItem] = Field(default_factory=list)
    summary: Summary = Field(default_factory=Summary)
