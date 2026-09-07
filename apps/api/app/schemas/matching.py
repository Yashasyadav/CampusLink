import uuid
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.agents import QueryUnderstandingResult, DiscoveryResponse, AgentTrace


class HelpTypeEnum(str, Enum):
    TECHNICAL_GUIDANCE = "TECHNICAL_GUIDANCE"
    PROJECT_COLLABORATION = "PROJECT_COLLABORATION"
    RESEARCH_GUIDANCE = "RESEARCH_GUIDANCE"
    HARDWARE_SUPPORT = "HARDWARE_SUPPORT"
    SOFTWARE_SUPPORT = "SOFTWARE_SUPPORT"
    DEBUGGING_HELP = "DEBUGGING_HELP"
    DOMAIN_EXPERTISE = "DOMAIN_EXPERTISE"
    FACILITY_ACCESS = "FACILITY_ACCESS"
    PREVIOUS_SOLUTION_REFERENCE = "PREVIOUS_SOLUTION_REFERENCE"


class EvidenceItem(BaseModel):
    source_type: str = Field(..., description="Source entity type e.g. PROFILE, PROJECT, RESEARCH, PROBLEM_SOLUTION, FACILITY, EQUIPMENT")
    source_id: str = Field(..., description="Source entity ID string")
    source_title: str = Field(..., description="Source title or name")
    snippet: str = Field(..., description="Supporting evidence excerpt")
    relevance: float = Field(default=0.0, description="Normalized relevance score 0.0 to 1.0")


class MatchingResult(BaseModel):
    candidate_id: str = Field(..., description="Candidate entity ID string")
    candidate_type: str = Field(..., description="PERSON, PROJECT, RESEARCH, PROBLEM_SOLUTION, FACILITY, EQUIPMENT")
    title: str = Field(..., description="Candidate main title/name")
    subtitle: Optional[str] = Field(default=None, description="Subtitle or department/role info")
    relevance_score: float = Field(..., description="Normalized score 0.0 to 1.0")
    relevance_level: str = Field(..., description="High relevance, Strong match, Relevant, Potential match")
    matched_skills: List[str] = Field(default=[], description="Matched candidate skills")
    matched_technologies: List[str] = Field(default=[], description="Matched candidate technologies")
    matched_domains: List[str] = Field(default=[], description="Matched candidate domains")
    supporting_evidence: List[EvidenceItem] = Field(default=[], description="Aggregated supporting evidence")
    evidence_strength: str = Field(default="Moderate evidence", description="Strong evidence, Moderate evidence, Basic evidence")
    evidence_count: int = Field(default=0, description="Total evidence sources count")
    person_evidence_graph: Dict[str, Any] = Field(default={}, description="Structured DB-backed candidate contribution graph")
    explanation: str = Field(..., description="Human readable evidence-backed explanation")
    help_type: Optional[HelpTypeEnum] = Field(default=None, description="Classified actionable help type")
    strengths: List[str] = Field(default=[], description="Key candidate strengths")
    limitations: List[str] = Field(default=[], description="Known limitations or capability gaps")


class HelpChainNode(BaseModel):
    step_number: int = Field(..., description="Sequence step 1, 2, 3...")
    focus_area: str = Field(..., description="Specific domain/skill focus for this node")
    candidate_id: str = Field(..., description="Candidate entity ID string")
    candidate_name: str = Field(..., description="Candidate display name")
    candidate_type: str = Field(..., description="Entity type of candidate")
    reason: str = Field(..., description="Explanation why this candidate covers this step")
    matched_skills: List[str] = Field(default=[], description="Skills covered by this candidate node")


class HelpChain(BaseModel):
    needed_capabilities: List[str] = Field(default=[], description="Required capabilities for query")
    covered_capabilities: List[str] = Field(default=[], description="Capabilities covered by help chain")
    nodes: List[HelpChainNode] = Field(default=[], description="Ordered sequence of candidate nodes")
    explanation: str = Field(..., description="Concise explanation of potential expertise chain")
    is_single_candidate_sufficient: bool = Field(default=False, description="True if one single candidate covers all requirements")


class MatchingAnalyzeRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="Natural language problem statement")
    discovery: Optional[DiscoveryResponse] = Field(default=None, description="Optional pre-computed Phase 7 discovery result")


class MatchingAnalyzeResponse(BaseModel):
    query: str = Field(..., description="Input problem statement")
    understanding: QueryUnderstandingResult = Field(..., description="Structured query understanding")
    top_people: List[MatchingResult] = Field(default=[], description="Ranked top people candidates")
    top_projects: List[MatchingResult] = Field(default=[], description="Ranked top project candidates")
    top_solutions: List[MatchingResult] = Field(default=[], description="Ranked top problem/solution candidates")
    research: List[MatchingResult] = Field(default=[], description="Ranked research candidates")
    facilities: List[MatchingResult] = Field(default=[], description="Ranked campus facility candidates")
    help_chain: Optional[HelpChain] = Field(default=None, description="Potential expertise chain analysis")
    traces: List[AgentTrace] = Field(default=[], description="Agent execution traces")
    metadata: Dict[str, Any] = Field(default={}, description="Processing status and candidate statistics")
