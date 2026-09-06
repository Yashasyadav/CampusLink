import uuid
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class IntentEnum(str, Enum):
    FIND_PERSON = "FIND_PERSON"
    FIND_PROJECT = "FIND_PROJECT"
    FIND_RESEARCH = "FIND_RESEARCH"
    FIND_SIMILAR_SOLUTION = "FIND_SIMILAR_SOLUTION"
    FIND_FACILITY = "FIND_FACILITY"
    FIND_EQUIPMENT = "FIND_EQUIPMENT"
    FIND_EXPERTISE_AND_SIMILAR_SOLUTIONS = "FIND_EXPERTISE_AND_SIMILAR_SOLUTIONS"
    GENERAL_CAMPUS_DISCOVERY = "GENERAL_CAMPUS_DISCOVERY"


class Evidence(BaseModel):
    entity_type: str = Field(..., description="Target entity type (e.g. PROJECT, PROFILE, PROBLEM_SOLUTION)")
    entity_id: uuid.UUID = Field(..., description="Unique entity UUID")
    title: str = Field(..., description="Entity title or name")
    source: str = Field(..., description="Source tool or service (e.g. search_people, search_projects)")
    snippet: str = Field(..., description="Excerpt or snippet text")
    score: float = Field(default=0.0, description="Raw retrieval score")


class QueryUnderstandingResult(BaseModel):
    original_query: str = Field(..., description="Input user request")
    domain: List[str] = Field(default=[], description="Extracted academic or technical domains")
    skills: List[str] = Field(default=[], description="Extracted relevant skills")
    technologies: List[str] = Field(default=[], description="Extracted relevant technologies or hardware")
    problem_keywords: List[str] = Field(default=[], description="Extracted problem/symptom keywords")
    intent: IntentEnum = Field(default=IntentEnum.GENERAL_CAMPUS_DISCOVERY, description="Structured query intent classification")
    needs_people: bool = Field(default=True, description="Whether people discovery agent should be invoked")
    needs_projects: bool = Field(default=True, description="Whether project/knowledge discovery agent should be invoked")
    needs_solutions: bool = Field(default=True, description="Whether problem/solution discovery agent should be invoked")
    needs_facilities: bool = Field(default=True, description="Whether facility discovery agent should be invoked")


class PeopleCandidate(BaseModel):
    user_id: uuid.UUID = Field(..., description="Target user UUID")
    display_name: str = Field(..., description="User display name")
    department: Optional[str] = Field(default=None, description="Department name")
    matched_skills: List[str] = Field(default=[], description="List of skills matching query")
    evidence: List[Evidence] = Field(default=[], description="Supporting evidence items")


class PeopleDiscoveryResult(BaseModel):
    candidates: List[PeopleCandidate] = Field(default=[], description="List of evidence-backed candidates")
    status: str = Field(default="SUCCESS", description="Agent execution status")
    summary: str = Field(default="", description="Summary explanation of findings")


class ProjectKnowledgeResult(BaseModel):
    projects: List[Dict[str, Any]] = Field(default=[], description="Discovered relevant projects")
    research: List[Dict[str, Any]] = Field(default=[], description="Discovered relevant research items")
    solutions: List[Dict[str, Any]] = Field(default=[], description="Discovered relevant problem/solution records")
    evidence: List[Evidence] = Field(default=[], description="Supporting evidence items")
    status: str = Field(default="SUCCESS", description="Agent execution status")


class FacilityDiscoveryResult(BaseModel):
    facilities: List[Dict[str, Any]] = Field(default=[], description="Discovered relevant campus facilities/labs")
    equipment: List[Dict[str, Any]] = Field(default=[], description="Discovered relevant equipment")
    evidence: List[Evidence] = Field(default=[], description="Supporting evidence items")
    status: str = Field(default="SUCCESS", description="Agent execution status")


class AgentTrace(BaseModel):
    agent_name: str = Field(..., description="Agent name identifier")
    started_at: str = Field(..., description="Execution start ISO timestamp")
    completed_at: str = Field(..., description="Execution completion ISO timestamp")
    tools_called: List[str] = Field(default=[], description="List of tool names invoked during trace")
    result_count: int = Field(default=0, description="Total candidates/items discovered")
    status: str = Field(default="SUCCESS", description="Execution status")
    duration_ms: float = Field(default=0.0, description="Execution duration in milliseconds")


class DiscoveryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="Natural language campus problem query")


class DiscoveryResponse(BaseModel):
    query: str = Field(..., description="Original search request")
    query_understanding: QueryUnderstandingResult = Field(..., description="Structured query understanding analysis")
    people: PeopleDiscoveryResult = Field(..., description="Discovered evidence-backed people candidates")
    projects: ProjectKnowledgeResult = Field(..., description="Discovered projects, research, and solutions")
    facilities: FacilityDiscoveryResult = Field(..., description="Discovered labs and equipment")
    evidence: List[Evidence] = Field(default=[], description="Aggregated evidence pointers across all agents")
    status: str = Field(default="SUCCESS", description="Overall execution status")
    traces: List[AgentTrace] = Field(default=[], description="Agent trace execution metadata")
