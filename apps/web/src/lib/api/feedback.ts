import { fetchApi } from "@/lib/api-client";

export type FeedbackType =
  | "HELPFUL"
  | "NOT_HELPFUL"
  | "PARTIALLY_HELPFUL"
  | "WRONG_MATCH"
  | "OUTDATED"
  | "INSUFFICIENT_EVIDENCE";

export interface FeedbackSubmitRequest {
  feedback_type: FeedbackType;
  comment?: string;
}

export interface FeedbackResponse {
  id: string;
  recommendation_event_id: string;
  user_id: string;
  feedback_type: FeedbackType;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface EntityTypeMetrics {
  entity_type: string;
  total_recommendations: number;
  feedback_count: number;
  helpful_count: number;
  negative_count: number;
  helpful_rate: number;
  average_relevance: number;
  average_evidence_quality: number;
}

export interface QualityMetricsResponse {
  total_recommendations: number;
  total_feedback: number;
  helpful_count: number;
  negative_count: number;
  helpful_rate: number;
  negative_rate: number;
  explanation_coverage: number;
  evidence_quality_avg: number;
  feedback_coverage: number;
  average_relevance: number;
  by_entity_type: EntityTypeMetrics[];
}

export interface AdminRecommendationItem {
  id: string;
  request_id: string;
  user_id: string;
  query: string;
  entity_type: string;
  entity_id: string;
  entity_title?: string;
  rank_position: number;
  relevance_score: number;
  evidence_quality_score: number;
  explanation_generated?: string;
  feedback_type?: FeedbackType;
  feedback_comment?: string;
  quality_flags: string[];
  created_at: string;
}

export interface AdminRecommendationDetailResponse {
  id: string;
  request_id: string;
  user_id: string;
  query: string;
  entity_type: string;
  entity_id: string;
  entity_title?: string;
  entity_subtitle?: string;
  rank_position: number;
  relevance_score: number;
  evidence_quality_score: number;
  explanation_generated?: string;
  score_components: Record<string, unknown>;
  supporting_evidence: Array<Record<string, unknown>>;
  quality_flags: string[];
  feedback?: FeedbackResponse;
  created_at: string;
}

export const feedbackApi = {
  submitFeedback: async (recommendationId: string, data: FeedbackSubmitRequest): Promise<FeedbackResponse> => {
    return fetchApi<FeedbackResponse>(`/api/v1/feedback/recommendations/${recommendationId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getFeedback: async (recommendationId: string): Promise<FeedbackResponse> => {
    return fetchApi<FeedbackResponse>(`/api/v1/feedback/recommendations/${recommendationId}`);
  },

  getMetrics: async (): Promise<QualityMetricsResponse> => {
    return fetchApi<QualityMetricsResponse>("/api/v1/admin/recommendations/metrics");
  },

  getAdminMetrics: async (): Promise<QualityMetricsResponse> => {
    return fetchApi<QualityMetricsResponse>("/api/v1/admin/recommendations/metrics");
  },

  getAdminRecommendations: async (options?: {
    query?: string;
    entity_type?: string;
    has_quality_flag?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: AdminRecommendationItem[]; total: number }> => {
    const params = new URLSearchParams();
    if (options?.query) params.append("query", options.query);
    if (options?.entity_type) params.append("entity_type", options.entity_type);
    if (options?.has_quality_flag) params.append("has_quality_flag", options.has_quality_flag);
    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("page_size", options.limit.toString());

    const queryString = params.toString();
    return fetchApi<{ items: AdminRecommendationItem[]; total: number }>(
      `/api/v1/admin/recommendations${queryString ? `?${queryString}` : ""}`
    );
  },

  getAdminRecommendationDetail: async (id: string): Promise<AdminRecommendationDetailResponse> => {
    return fetchApi<AdminRecommendationDetailResponse>(`/api/v1/admin/recommendations/${id}`);
  },
};
