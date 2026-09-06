import { fetchApi } from "@/lib/api-client";
import { MatchingAnalyzeResponse } from "@/types/matching";

export const matchingApi = {
  analyze: async (query: string): Promise<MatchingAnalyzeResponse> => {
    return fetchApi<MatchingAnalyzeResponse>("/api/v1/matching/analyze", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  },
};
