import { fetchApi } from "@/lib/api-client";
import { HealthStatus } from "@/types";

export const healthService = {
  checkHealth: async (): Promise<HealthStatus> => {
    return fetchApi<HealthStatus>("/health");
  },
};
