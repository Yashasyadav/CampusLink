import { fetchApi } from "@/lib/api-client";

export type EntityTypeFilter =
  | "PROFILE"
  | "PROJECT"
  | "RESEARCH"
  | "FACILITY"
  | "EQUIPMENT"
  | "PROBLEM_SOLUTION";

export type SearchMode = "SEMANTIC" | "HYBRID";

export interface SearchQueryPayload {
  query: string;
  entity_types?: EntityTypeFilter[];
  mode?: SearchMode;
  limit?: number;
  offset?: number;
}

export interface SearchResultItem {
  entity_type: EntityTypeFilter;
  entity_id: string;
  title: string;
  snippet: string;
  score: number;
  matched_fields: string[];
  metadata: Record<string, unknown>;
}

export interface SearchQueryResponse {
  query: string;
  mode: SearchMode;
  total: number;
  results: SearchResultItem[];
  duration_ms: number;
}

export interface ReindexResponse {
  status: string;
  total_records: number;
  indexed_records: number;
  skipped_records: number;
  failed_records: number;
  duration_seconds: number;
  embedding_model: string;
  errors: string[];
}

export const searchService = {
  executeSearch: async (payload: SearchQueryPayload): Promise<SearchQueryResponse> => {
    return fetchApi<SearchQueryResponse>("/api/v1/search", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  reindex: async (entityTypes?: EntityTypeFilter[]): Promise<ReindexResponse> => {
    return fetchApi<ReindexResponse>("/api/v1/search/reindex", {
      method: "POST",
      body: JSON.stringify({ entity_types: entityTypes }),
    });
  },
};
