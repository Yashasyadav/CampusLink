import { fetchApi } from "@/lib/api-client";

export interface EvidenceItem {
  entity_type: string;
  entity_id: string;
  title: string;
  source: string;
  snippet: string;
  score: number;
}

export interface QueryUnderstandingResult {
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

export interface PeopleCandidate {
  user_id: string;
  display_name: string;
  department?: string;
  matched_skills: string[];
  evidence: EvidenceItem[];
}

export interface PeopleDiscoveryResult {
  candidates: PeopleCandidate[];
  status: string;
  summary: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  snippet: string;
  metadata?: Record<string, unknown>;
}

export interface ProjectKnowledgeResult {
  projects: ProjectItem[];
  research: ProjectItem[];
  solutions: ProjectItem[];
  evidence: EvidenceItem[];
  status: string;
}

export interface FacilityItem {
  id: string;
  name: string;
  snippet: string;
  metadata?: Record<string, unknown>;
}

export interface FacilityDiscoveryResult {
  facilities: FacilityItem[];
  equipment: FacilityItem[];
  evidence: EvidenceItem[];
  status: string;
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

export interface DiscoveryResponse {
  query: string;
  query_understanding: QueryUnderstandingResult;
  people: PeopleDiscoveryResult;
  projects: ProjectKnowledgeResult;
  facilities: FacilityDiscoveryResult;
  evidence: EvidenceItem[];
  status: string;
  traces: AgentTrace[];
}

export const agentService = {
  discover: async (query: string): Promise<DiscoveryResponse> => {
    return fetchApi<DiscoveryResponse>("/api/v1/agents/discover", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  },
};
