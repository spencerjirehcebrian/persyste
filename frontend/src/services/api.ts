import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { logger } from "@/utils/logger";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TodosResponse,
  CreateTodoRequest,
  UpdateTodoRequest,
  Todo,
  UserPreferences,
  User,
  ApiResponse,
  TodoQuery,
} from "@/types";

// Define metadata interface
interface RequestMetadata {
  requestId: number;
  startTime: number;
}

// Enhanced error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends Error {
  constructor(message: string = "Request timeout") {
    super(message);
    this.name = "TimeoutError";
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
  exponentialBackoff?: boolean;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  },
};

// Circuit breaker implementation
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private maxFailures = 5,
    private resetTimeout = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = "half-open";
        logger.info("Circuit breaker moving to half-open state");
      } else {
        throw new Error(
          "Circuit breaker is open - service temporarily unavailable"
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.maxFailures) {
      this.state = "open";
      logger.warn("Circuit breaker opened due to consecutive failures", {
        failureCount: this.failureCount,
        timestamp: new Date().toISOString(),
      });
    }
  }

  getState(): string {
    return this.state;
  }
}

// Request deduplication
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, request: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      logger.debug("Deduplicating request", { key });
      return this.pendingRequests.get(key);
    }

    const promise = request();
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      this.pendingRequests.delete(key);
      return result;
    } catch (error) {
      this.pendingRequests.delete(key);
      throw error;
    }
  }
}

// Enhanced API class
class ApiService {
  private axiosInstance;
  private circuitBreaker = new CircuitBreaker();
  private deduplicator = new RequestDeduplicator();
  private requestCounter = 0;
  private requestMetadata = new Map<string, RequestMetadata>();

  constructor() {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    this.axiosInstance = axios.create({
      baseURL: API_URL,
      timeout: 10000, // 10 seconds
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const requestId = ++this.requestCounter;
        const metadata: RequestMetadata = { requestId, startTime: Date.now() };
        
        // Store metadata using a unique key
        const metadataKey = `${config.method}_${config.url}_${requestId}`;
        this.requestMetadata.set(metadataKey, metadata);
        
        // Store the key on the config for later retrieval
        (config as any).__metadataKey = metadataKey;

        // Add auth token
        const token = localStorage.getItem("authToken");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        logger.logApiRequest(
          config.method?.toUpperCase() || "GET",
          config.url || "",
          config.data
        );

        return config;
      },
      (error) => {
        logger.error("Request interceptor error", { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const metadataKey = (response.config as any).__metadataKey;
        const metadata = metadataKey ? this.requestMetadata.get(metadataKey) : undefined;
        const duration = metadata ? Date.now() - metadata.startTime : undefined;

        // Clean up metadata
        if (metadataKey) {
          this.requestMetadata.delete(metadataKey);
        }

        logger.logApiResponse(
          response.config.method?.toUpperCase() || "GET",
          response.config.url || "",
          response.status,
          response.data,
          duration
        );

        return response;
      },
      (error: AxiosError) => {
        const metadataKey = (error.config as any)?.__metadataKey;
        const metadata = metadataKey ? this.requestMetadata.get(metadataKey) : undefined;
        const duration = metadata ? Date.now() - metadata.startTime : undefined;

        // Clean up metadata
        if (metadataKey) {
          this.requestMetadata.delete(metadataKey);
        }

        if (error.response) {
          logger.logApiResponse(
            error.config?.method?.toUpperCase() || "GET",
            error.config?.url || "",
            error.response.status,
            error.response.data,
            duration
          );

          // Handle 401 errors
          if (error.response.status === 401) {
            logger.warn("Unauthorized access - clearing auth token");
            localStorage.removeItem("authToken");
            if (typeof window !== 'undefined') {
              window.location.href = "/login";
            }
          }
        } else {
          logger.error("Network error in response interceptor", {
            message: error.message,
            code: error.code,
            duration: duration ? `${duration}ms` : undefined,
          });
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  private transformError(error: AxiosError): Error {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return new TimeoutError("Request timeout");
    }

    if (!error.response) {
      return new NetworkError(
        "Network error - please check your connection",
        error
      );
    }

    const { status, data } = error.response;
    const message =
      (data as any)?.message || error.message || "An error occurred";

    return new ApiError(message, status, (data as any)?.code, data);
  }

  private async retryRequest<T>(
    request: () => Promise<T>,
    config: RetryConfig = defaultRetryConfig
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = config.exponentialBackoff
            ? config.retryDelay * Math.pow(2, attempt - 1)
            : config.retryDelay;

          logger.info(
            `Retrying request (attempt ${attempt}/${config.maxRetries})`,
            {
              delay: `${delay}ms`,
              attempt,
              maxRetries: config.maxRetries,
            }
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        return await request();
      } catch (error) {
        lastError = error as Error;

        if (attempt === config.maxRetries) {
          logger.error("Max retries exceeded", {
            attempts: attempt + 1,
            error: lastError.message,
          });
          break;
        }

        if (
          error instanceof AxiosError &&
          config.retryCondition &&
          !config.retryCondition(error)
        ) {
          logger.info("Retry condition not met, not retrying", {
            status: error.response?.status,
            message: error.message,
          });
          break;
        }

        logger.warn(`Request failed, will retry`, {
          attempt: attempt + 1,
          error: lastError.message,
          nextRetryIn: config.exponentialBackoff
            ? `${config.retryDelay * Math.pow(2, attempt)}ms`
            : `${config.retryDelay}ms`,
        });
      }
    }

    throw lastError!;
  }

  private async makeRequest<T>(
    request: () => Promise<AxiosResponse<T>>,
    retryConfig?: RetryConfig
  ): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      const response = await this.retryRequest(request, retryConfig);
      return response.data;
    });
  }

  // Auth API
  async register(data: RegisterRequest): Promise<AuthResponse> {
    logger.logUserAction("Attempting registration", { email: data.email });

    return this.makeRequest(
      () => this.axiosInstance.post<AuthResponse>("/auth/register", data),
      { ...defaultRetryConfig, maxRetries: 1 } // Don't retry registration
    );
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    logger.logUserAction("Attempting login", { email: data.email });

    return this.makeRequest(
      () => this.axiosInstance.post<AuthResponse>("/auth/login", data),
      { ...defaultRetryConfig, maxRetries: 1 } // Don't retry login
    );
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const cacheKey = "getCurrentUser";

    return this.deduplicator.deduplicate(cacheKey, () =>
      this.makeRequest(() =>
        this.axiosInstance.get<ApiResponse<User>>("/auth/me")
      )
    );
  }

  async updatePreferences(
    preferences: UserPreferences
  ): Promise<ApiResponse<UserPreferences>> {
    logger.logUserAction("Updating user preferences", preferences);

    return this.makeRequest(() =>
      this.axiosInstance.patch<ApiResponse<UserPreferences>>(
        "/auth/preferences",
        preferences
      )
    );
  }

  // Todo API
  async getTodos(query: TodoQuery = {}): Promise<TodosResponse> {
    const params = new URLSearchParams();

    if (query.filter) params.append("filter", query.filter);
    if (query.page) params.append("page", query.page.toString());
    if (query.limit) params.append("limit", query.limit.toString());
    if (query.sortBy) params.append("sortBy", query.sortBy);
    if (query.sortOrder) params.append("sortOrder", query.sortOrder);

    const cacheKey = `getTodos_${params.toString()}`;

    return this.deduplicator.deduplicate(cacheKey, () =>
      this.makeRequest(() =>
        this.axiosInstance.get<TodosResponse>(`/todos?${params.toString()}`)
      )
    );
  }

  async createTodo(data: CreateTodoRequest): Promise<ApiResponse<Todo>> {
    logger.logUserAction("Creating todo", {
      title: data.title,
      createdVia: data.createdVia,
    });

    return this.makeRequest(() =>
      this.axiosInstance.post<ApiResponse<Todo>>("/todos", data)
    );
  }

  async updateTodo(
    id: string,
    data: UpdateTodoRequest
  ): Promise<ApiResponse<Todo>> {
    logger.logUserAction("Updating todo", { id, ...data });

    return this.makeRequest(() =>
      this.axiosInstance.put<ApiResponse<Todo>>(`/todos/${id}`, data)
    );
  }

  async toggleTodo(id: string): Promise<ApiResponse<Todo>> {
    logger.logUserAction("Toggling todo", { id });

    return this.makeRequest(() =>
      this.axiosInstance.patch<ApiResponse<Todo>>(`/todos/${id}/toggle`)
    );
  }

  async deleteTodo(id: string): Promise<ApiResponse> {
    logger.logUserAction("Deleting todo", { id });

    return this.makeRequest(() =>
      this.axiosInstance.delete<ApiResponse>(`/todos/${id}`)
    );
  }

  // System API
  async healthCheck(): Promise<ApiResponse> {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const baseURL = API_URL.replace("/api", "");

    return this.makeRequest(() =>
      axios.get<ApiResponse>(`${baseURL}/health`)
    );
  }

  async apiStatus(): Promise<ApiResponse> {
    return this.makeRequest(() =>
      this.axiosInstance.get<ApiResponse>("/status")
    );
  }

  // Utility methods
  getCircuitBreakerState(): string {
    return this.circuitBreaker.getState();
  }

  // Health monitoring
  async monitorHealth(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      logger.warn("Health check failed", { error: (error as Error).message });
      return false;
    }
  }
}

// Export singleton instance
export const api = new ApiService();

// Backwards compatibility exports
export const authApi = {
  register: (data: RegisterRequest) => api.register(data),
  login: (data: LoginRequest) => api.login(data),
  getCurrentUser: () => api.getCurrentUser(),
  updatePreferences: (preferences: UserPreferences) =>
    api.updatePreferences(preferences),
};

export const todoApi = {
  getTodos: (query?: TodoQuery) => api.getTodos(query),
  createTodo: (data: CreateTodoRequest) => api.createTodo(data),
  updateTodo: (id: string, data: UpdateTodoRequest) =>
    api.updateTodo(id, data),
  toggleTodo: (id: string) => api.toggleTodo(id),
  deleteTodo: (id: string) => api.deleteTodo(id),
};

export const systemApi = {
  healthCheck: () => api.healthCheck(),
  apiStatus: () => api.apiStatus(),
};

export default api;