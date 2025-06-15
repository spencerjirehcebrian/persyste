// src/hooks/useErrorHandler.ts
import { useCallback } from "react";
import { logger } from "@/utils/logger";
import { ApiError, NetworkError, TimeoutError } from "@/services/api";

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  reportError?: boolean;
  fallbackMessage?: string;
}

export const useErrorHandler = () => {
  const handleError = useCallback(
    (
      error: Error | unknown,
      context?: string,
      options: ErrorHandlerOptions = {}
    ) => {
      const {
        showToast = true,
        logError = true,
        reportError = true,
        fallbackMessage = "An unexpected error occurred",
      } = options;

      let userMessage = fallbackMessage;
      let errorDetails: any = {};

      // Determine error type and appropriate user message
      if (error instanceof ApiError) {
        userMessage = error.message;
        errorDetails = {
          status: error.status,
          code: error.code,
          details: error.details,
        };
      } else if (error instanceof NetworkError) {
        userMessage =
          "Connection error. Please check your internet connection.";
        errorDetails = { originalError: error.originalError?.message };
      } else if (error instanceof TimeoutError) {
        userMessage = "Request timed out. Please try again.";
      } else if (error instanceof Error) {
        userMessage = error.message || fallbackMessage;
        errorDetails = { stack: error.stack };
      } else {
        errorDetails = { rawError: error };
      }

      // Log the error
      if (logError) {
        logger.error(`Error in ${context || "unknown context"}`, {
          message: userMessage,
          ...errorDetails,
        });
      }

      // Show user-friendly message (implement your toast/notification system)
      if (showToast) {
        // TODO: Integrate with your notification system
        console.warn("User notification:", userMessage);
      }

      // Report to error tracking service
      if (reportError) {
        // TODO: Report to your error tracking service
        logger.error("Error reported to tracking service", {
          context,
          userMessage,
          ...errorDetails,
        });
      }

      return {
        userMessage,
        shouldRetry:
          error instanceof NetworkError || error instanceof TimeoutError,
        shouldReload: error instanceof ApiError && error.status === 500,
      };
    },
    []
  );

  return { handleError };
};
