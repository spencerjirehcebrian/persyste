// src/hooks/queries/useSystem.ts
import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@/services/api";
import { queryKeys } from "./queryKeys";
import { logger } from "@/utils/logger";

// Health check query
export const useHealthCheck = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.health(),
    queryFn: async () => {
      const response = await systemApi.healthCheck();
      if (response.success) {
        return response;
      }
      throw new Error("Health check failed");
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      logger.warn("Health check failed", {
        attempt: failureCount + 1,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return failureCount < 2;
    },
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchIntervalInBackground: false,
  });
};

// API status query
export const useApiStatus = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.status(),
    queryFn: async () => {
      const response = await systemApi.apiStatus();
      if (response.success) {
        return response;
      }
      throw new Error("API status check failed");
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

// Combined system health hook
export const useSystemHealth = () => {
  const healthQuery = useHealthCheck();
  const statusQuery = useApiStatus();

  return {
    isHealthy: healthQuery.isSuccess && statusQuery.isSuccess,
    isLoading: healthQuery.isLoading || statusQuery.isLoading,
    error: healthQuery.error || statusQuery.error,
    health: healthQuery.data,
    status: statusQuery.data,
    refetchHealth: healthQuery.refetch,
    refetchStatus: statusQuery.refetch,
  };
};
