import { useEffect, useState } from "react";
import type { DashboardDataDto } from "@/types";

interface UseDashboardDataReturn {
  data: DashboardDataDto | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook for fetching and managing dashboard data.
 * Handles loading states, errors, and automatic redirection on authentication failure.
 */
export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardDataDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/dashboard");

        // Handle authentication errors
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
        }

        const dashboardData = (await response.json()) as DashboardDataDto;
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return { data, isLoading, error };
}
