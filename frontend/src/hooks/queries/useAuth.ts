// src/hooks/queries/useAuth.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/services/api";
import { queryKeys } from "./queryKeys";
import { logger } from "@/utils/logger";
import type {
  LoginRequest,
  RegisterRequest,
  User,
  UserPreferences,
} from "@/types";

// Query for current user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.currentUser(),
    queryFn: async () => {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error("Failed to get current user");
    },
    enabled: !!localStorage.getItem("authToken"),
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      logger.logUserAction("Attempting login", { email: credentials.email });
      const response = await authApi.login(credentials);

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error("Login failed");
    },
    onSuccess: (data) => {
      const { user, token } = data;
      localStorage.setItem("authToken", token);

      // Set the user data in the cache
      queryClient.setQueryData(queryKeys.currentUser(), user);

      logger.logUserAction("Login successful", { userId: user.id });
    },
    onError: (error) => {
      logger.error("Login failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
};

// Register mutation
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: RegisterRequest) => {
      logger.logUserAction("Attempting registration", {
        email: userData.email,
      });
      const response = await authApi.register(userData);

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error("Registration failed");
    },
    onSuccess: (data) => {
      const { user, token } = data;
      localStorage.setItem("authToken", token);

      // Set the user data in the cache
      queryClient.setQueryData(queryKeys.currentUser(), user);

      logger.logUserAction("Registration successful", { userId: user.id });
    },
    onError: (error) => {
      logger.error("Registration failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
};

// Update preferences mutation
export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      logger.logUserAction("Updating user preferences", preferences);
      const response = await authApi.updatePreferences(preferences);

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error("Failed to update preferences");
    },
    onMutate: async (newPreferences) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.currentUser() });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData<User>(
        queryKeys.currentUser()
      );

      // Optimistically update the cache
      if (previousUser) {
        queryClient.setQueryData<User>(queryKeys.currentUser(), {
          ...previousUser,
          preferences: { ...previousUser.preferences, ...newPreferences },
        });
      }

      return { previousUser };
    },
    onError: (error, newPreferences, context) => {
      // If mutation fails, use the context returned from onMutate to roll back
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.currentUser(), context.previousUser);
      }

      logger.error("Failed to update preferences", {
        error: error instanceof Error ? error.message : "Unknown error",
        preferences: newPreferences,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.currentUser() });
    },
  });
};

// Logout function (not a mutation since it's local only)
export const useLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    localStorage.removeItem("authToken");
    queryClient.clear(); // Clear all cached data
    logger.logUserAction("User logged out");
  };
};
