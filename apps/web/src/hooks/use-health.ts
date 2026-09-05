import { useState, useEffect } from "react";
import { healthService } from "@/services/api";
import { HealthStatus } from "@/types";

export function useHealth() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    healthService
      .checkHealth()
      .then(setHealth)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { health, loading, error };
}
