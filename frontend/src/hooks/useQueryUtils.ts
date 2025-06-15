// src/hooks/useQueryUtils.ts
import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./queries/queryKeys";
import { logger } from "@/utils/logger";
import type { TodoFilter } from "@/types";

// Utility hook for common query operations
export const useQueryUtils = () => {
  const queryClient = useQueryClient();

  // Invalidate all todo queries
  const invalidateAllTodos = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.todos() });
    logger.debug("Invalidated all todo queries");
  };

  // Invalidate specific todo filter
  const invalidateTodoFilter = (filter: TodoFilter) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.todoList({ filter }),
    });
    logger.debug("Invalidated todo filter", { filter });
  };

  // Prefetch todos for a specific filter
  const prefetchTodos = async (filter: TodoFilter) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.todoList({ filter }),
      queryFn: async () => {
        const { todoApi } = await import("@/services/api");
        const response = await todoApi.getTodos({ filter });
        if (response.success && response.data) {
          return response.data.todos;
        }
        throw new Error("Failed to prefetch todos");
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
    logger.debug("Prefetched todos", { filter });
  };

  // Clear all cached data
  const clearAllCache = () => {
    queryClient.clear();
    logger.info("Cleared all query cache");
  };

  // Get cache stats for debugging
  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const stats = {
      totalQueries: queries.length,
      freshQueries: queries.filter((q) => q.isStale() === false).length,
      staleQueries: queries.filter((q) => q.isStale() === true).length,
      errorQueries: queries.filter((q) => q.state.status === "error").length,
      loadingQueries: queries.filter((q) => q.state.status === "pending")
        .length,
    };

    logger.debug("Query cache stats", stats);
    return stats;
  };

  // Force refetch all active queries
  const refetchAll = async () => {
    await queryClient.refetchQueries({ type: "active" });
    logger.info("Refetched all active queries");
  };

  // Remove specific query from cache
  const removeQuery = (queryKey: any[]) => {
    queryClient.removeQueries({ queryKey });
    logger.debug("Removed query from cache", { queryKey });
  };

  // Check if user is authenticated (has valid token)
  const isAuthenticated = () => {
    const userData = queryClient.getQueryData(queryKeys.currentUser());
    const hasToken = !!localStorage.getItem("authToken");
    return !!userData && hasToken;
  };

  // Optimistically update todo in cache
  const optimisticUpdateTodo = (todoId: string, updates: any) => {
    const queries = queryClient.getQueriesData({ queryKey: queryKeys.todos() });

    queries.forEach(([queryKey, data]) => {
      if (data && Array.isArray(data)) {
        const updatedData = data.map((todo) =>
          todo._id === todoId ? { ...todo, ...updates } : todo
        );
        queryClient.setQueryData(queryKey, updatedData);
      }
    });

    logger.debug("Optimistically updated todo", { todoId, updates });
  };

  // Batch multiple query operations
  const batchOperations = async (operations: (() => Promise<any>)[]) => {
    try {
      const results = await Promise.allSettled(operations.map((op) => op()));
      const failures = results.filter((r) => r.status === "rejected");

      if (failures.length > 0) {
        logger.warn("Some batch operations failed", {
          total: operations.length,
          failures: failures.length,
        });
      }

      return results;
    } catch (error) {
      logger.error("Batch operations failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  };

  // Background sync - useful for offline/online scenarios
  const backgroundSync = async () => {
    if (!navigator.onLine) {
      logger.debug("Skipping background sync - offline");
      return;
    }

    try {
      // Invalidate critical queries to refetch fresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.todos() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.health() }),
      ]);

      logger.info("Background sync completed");
    } catch (error) {
      logger.error("Background sync failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return {
    invalidateAllTodos,
    invalidateTodoFilter,
    prefetchTodos,
    clearAllCache,
    getCacheStats,
    refetchAll,
    removeQuery,
    isAuthenticated,
    optimisticUpdateTodo,
    batchOperations,
    backgroundSync,
  };
};

// Hook for handling offline/online scenarios
export const useNetworkStatus = () => {
  const queryUtils = useQueryUtils();
  const queryClient = useQueryClient();

  const handleOnline = () => {
    logger.info("Network connection restored");
    queryUtils.backgroundSync();
  };

  const handleOffline = () => {
    logger.warn("Network connection lost");
    // Pause all queries when offline
    queryClient
      .getQueryCache()
      .getAll()
      .forEach((query) => {
        query.setState({ ...query.state, fetchStatus: "idle" });
      });
  };

  // Set up event listeners
  React.useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline: navigator.onLine,
    handleOnline,
    handleOffline,
  };
};
