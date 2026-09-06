import { fetchApi } from "@/lib/api-client";
import {
  PaginatedResponse,
  Project,
  ResearchItem,
  Facility,
  Equipment,
  ProblemSolution,
} from "@/types";

export const knowledgeService = {
  // Projects
  getProjects: async (params: { page?: number; domain?: string; status?: string } = {}): Promise<PaginatedResponse<Project>> => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.domain) query.append("domain", params.domain);
    if (params.status) query.append("status", params.status);
    return fetchApi<PaginatedResponse<Project>>(`/api/v1/projects?${query.toString()}`);
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    return fetchApi<Project>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Research
  getResearch: async (params: { page?: number; research_area?: string } = {}): Promise<PaginatedResponse<ResearchItem>> => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.research_area) query.append("research_area", params.research_area);
    return fetchApi<PaginatedResponse<ResearchItem>>(`/api/v1/research?${query.toString()}`);
  },

  createResearch: async (data: Partial<ResearchItem>): Promise<ResearchItem> => {
    return fetchApi<ResearchItem>("/api/v1/research", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Facilities
  getFacilities: async (params: { page?: number; facility_type?: string } = {}): Promise<PaginatedResponse<Facility>> => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.facility_type) query.append("facility_type", params.facility_type);
    return fetchApi<PaginatedResponse<Facility>>(`/api/v1/facilities?${query.toString()}`);
  },

  createFacility: async (data: Partial<Facility>): Promise<Facility> => {
    return fetchApi<Facility>("/api/v1/facilities", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Equipment
  getEquipment: async (params: { page?: number; facility_id?: string } = {}): Promise<PaginatedResponse<Equipment>> => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.facility_id) query.append("facility_id", params.facility_id);
    return fetchApi<PaginatedResponse<Equipment>>(`/api/v1/equipment?${query.toString()}`);
  },

  createEquipment: async (facilityId: string, data: Partial<Equipment>): Promise<Equipment> => {
    return fetchApi<Equipment>(`/api/v1/facilities/${facilityId}/equipment`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Problem / Solutions
  getSolutions: async (params: { page?: number; domain?: string } = {}): Promise<PaginatedResponse<ProblemSolution>> => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.domain) query.append("domain", params.domain);
    return fetchApi<PaginatedResponse<ProblemSolution>>(`/api/v1/solutions?${query.toString()}`);
  },

  createSolution: async (data: Partial<ProblemSolution>): Promise<ProblemSolution> => {
    return fetchApi<ProblemSolution>("/api/v1/solutions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Resume document service
export interface ResumeDocument {
  id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  processing_status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CONFIRMED";
  created_at: string;
}

export interface ResumeCurrentResponse {
  document: ResumeDocument | null;
  extraction_status?: string;
}

export interface ResumeExtractionResponse {
  document_id: string;
  processing_status: string;
  confidence: number;
  model_name: string;
  extracted_data: Record<string, unknown>;
}

export const resumeService = {
  getCurrent: async (): Promise<ResumeCurrentResponse> => {
    return fetchApi<ResumeCurrentResponse>("/api/v1/documents/resume/current");
  },

  upload: async (file: File): Promise<{ message: string; document: ResumeDocument }> => {
    const formData = new FormData();
    formData.append("file", file);
    // Note: multipart — don't set Content-Type header (browser sets it with boundary)
    const { env } = await import("@/config/env");
    const response = await fetch(`${env.apiUrl}/api/v1/documents/resume`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(errData?.detail || `Upload failed: ${response.status}`);
    }
    return response.json();
  },

  process: async (documentId: string): Promise<{ message: string; document_id: string; extraction_id: string }> => {
    return fetchApi(`/api/v1/documents/resume/${documentId}/process`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  getExtraction: async (documentId: string): Promise<ResumeExtractionResponse> => {
    return fetchApi<ResumeExtractionResponse>(`/api/v1/documents/resume/${documentId}/extraction`);
  },

  confirm: async (documentId: string, payload: Record<string, unknown>): Promise<{ message: string; profile_completed: boolean }> => {
    return fetchApi(`/api/v1/documents/resume/${documentId}/confirm`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
