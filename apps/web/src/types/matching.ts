export interface EvidenceItem {
  source_type: string;
  source_id: string;
  source_title: string;
  snippet: string;
  relevance: number;
}

export interface MatchingResult {
  candidate_id: string;
  candidate_type: "PERSON" | "PROJECT" | "RESEARCH" | "PROBLEM_SOLUTION" | "FACILITY" | "EQUIPMENT";
  title: string;
  subtitle?: string | null;
  relevance_score: number;
  relevance_level: "High relevance" | "Strong match" | "Relevant" | "Potential match";
  matched_skills: string[];
  matched_technologies: string[];
  matched_domains: string[];
  supporting_evidence: EvidenceItem[];
  evidence_strength: "Strong" | "Moderate" | "Basic";
  explanation: string;
  help_type?: string | null;
  strengths: string[];
  limitations: string[];
  recommendation_event_id?: string;
  recommendation_id?: string;
}

export interface HelpChainNode {
  step_number: number;
  focus_area: string;
  candidate_id: string;
  candidate_name: string;
  candidate_type: string;
  reason: string;
  matched_skills: string[];
}

export interface HelpChain {
  needed_capabilities: string[];
  covered_capabilities: string[];
  nodes: HelpChainNode[];
  explanation: string;
  is_single_candidate_sufficient: boolean;
}

export interface QueryUnderstanding {
  original_query: string;
  domain: string[];
  skills: string[];
  technologies: string[];
  problem_keywords: string[];
  intent: string;
  needs_people: boolean;
  needs_projects: boolean;
  needs_solutions: boolean;
  needs_facilities: boolean;
}

export interface AgentTrace {
  agent_name: string;
  started_at: string;
  completed_at: string;
  tools_called: string[];
  result_count: number;
  status: string;
  duration_ms: number;
}

export interface MatchingAnalyzeResponse {
  query: string;
  understanding: QueryUnderstanding;
  top_people: MatchingResult[];
  top_projects: MatchingResult[];
  top_solutions: MatchingResult[];
  research: MatchingResult[];
  facilities: MatchingResult[];
  help_chain?: HelpChain | null;
  traces: AgentTrace[];
  metadata: {
    candidate_count: number;
    processing_status: string;
  };
}
