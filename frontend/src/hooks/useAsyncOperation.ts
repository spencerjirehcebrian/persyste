// src/hooks/useAsyncOperation.ts
import { useState, useCallback, useRef } from "react";
import { useErrorHandler } from "./useErrorHandler";
import { logger } from "@/utils/logger";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface AsyncOperationOptions {
  retryAttempts?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export const useAsyncOperation = <T = any>(
  options: AsyncOperationOptions = {}
) => {
  const { retryAttempts = 0, retryDelay = 1000, onSuccess, onError } = options;
  const { handleError } = useErrorHandler();

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (
      asyncFunction: (signal?: AbortSignal) => Promise<T>,
      context?: string
    ): Promise<T | undefined> => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      let lastError: Error;

      for (let attempt = 0; attempt <= retryAttempts; attempt++) {
        try {
          if (signal.aborted) {
            throw new Error("Operation cancelled");
          }

          if (attempt > 0) {
            logger.info(
              `Retrying async operation (attempt ${attempt}/${retryAttempts})`,
              { context }
            );
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelay * attempt)
            );
          }

          const result = await asyncFunction(signal);

          if (signal.aborted) {
            throw new Error("Operation cancelled");
          }

          setState({ data: result, loading: false, error: null });
          onSuccess?.(result);
          logger.debug("Async operation completed successfully", { context });

          return result;
        } catch (error) {
          lastError = error as Error;

          if (signal.aborted) {
            setState((prev) => ({ ...prev, loading: false }));
            return undefined;
          }

          if (attempt === retryAttempts) {
            const errorResult = handleError(error, context);
            setState({ data: null, loading: false, error: lastError });
            onError?.(lastError);
            throw error;
          }

          logger.warn(
            `Async operation failed (attempt ${attempt + 1}/${
              retryAttempts + 1
            })`,
            {
              context,
              error: lastError.message,
            }
          );
        }
      }

      return undefined;
    },
    [retryAttempts, retryDelay, onSuccess, onError, handleError]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState((prev) => ({ ...prev, loading: false }));
      logger.debug("Async operation cancelled");
    }
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({ data: null, loading: false, error: null });
  }, [cancel]);

  return {
    ...state,
    execute,
    cancel,
    reset,
  };
};
