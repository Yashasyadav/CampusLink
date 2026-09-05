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
    return fetchApi<PaginatedResponse<Project>>(`/projects?${query.toString()}`);
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    return fetchApi<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Research
  getResearch: async (params: { page?: number; research_area?: string } = {}): Promise<PaginatedResponse<ResearchItem>> => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.research_area) query.append("research_area", params.research_area);
    return fetchApi<PaginatedResponse<ResearchItem>>(`/research?${query.toString()}`);
  },

  createResearch: async (data: Partial<ResearchItem>): Promise<ResearchItem> => {
    return fetchApi<ResearchItem>("/research", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Facilities
  getFacilities: async (params: { page?: number; facility_type?: string } = {}): Promise<PaginatedResponse<Facility>> => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.facility_type) query.append("facility_type", params.facility_type);
    return fetchApi<PaginatedResponse<Facility>>(`/facilities?${query.toString()}`);
  },

  createFacility: async (data: Partial<Facility>): Promise<Facility> => {
    return fetchApi<Facility>("/facilities", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Equipment
  getEquipment: async (params: { page?: number; facility_id?: string } = {}): Promise<PaginatedResponse<Equipment>> => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.facility_id) query.append("facility_id", params.facility_id);
    return fetchApi<PaginatedResponse<Equipment>>(`/equipment?${query.toString()}`);
  },

  createEquipment: async (facilityId: string, data: Partial<Equipment>): Promise<Equipment> => {
    return fetchApi<Equipment>(`/facilities/${facilityId}/equipment`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Problem / Solutions
  getSolutions: async (params: { page?: number; domain?: string } = {}): Promise<PaginatedResponse<ProblemSolution>> => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.domain) query.append("domain", params.domain);
    return fetchApi<PaginatedResponse<ProblemSolution>>(`/solutions?${query.toString()}`);
  },

  createSolution: async (data: Partial<ProblemSolution>): Promise<ProblemSolution> => {
    return fetchApi<ProblemSolution>("/solutions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
