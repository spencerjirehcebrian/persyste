
// src/types/index.ts

export interface User {
    id: string;
    email: string;
    preferences: {
      theme: 'light' | 'dark';
      defaultView: 'today' | 'all';
    };
  }
  
  export interface Todo {
    _id: string;
    userId: string;
    title: string;
    description?: string;
    dueDate: string;
    repeatType: 'none' | 'daily';
    completed: boolean;
    completedAt?: string;
    createdVia: 'text' | 'voice';
    createdAt: string;
    updatedAt: string;
  }
  
  export interface CreateTodoRequest {
    title: string;
    description?: string;
    dueDate?: string;
    repeatType?: 'none' | 'daily';
    createdVia?: 'text' | 'voice';
  }
  
  export interface UpdateTodoRequest {
    title?: string;
    description?: string;
    dueDate?: string;
    repeatType?: 'none' | 'daily';
  }
  
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface RegisterRequest {
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    success: boolean;
    data: {
      user: User;
      token: string;
    };
    message?: string;
  }
  
  export interface TodosResponse {
    success: boolean;
    data: {
      todos: Todo[];
      count: number;
    };
    message?: string;
  }
  
  export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
  }
  
  export interface UserPreferences {
    theme?: 'light' | 'dark';
    defaultView?: 'today' | 'all';
  }
  
  export type TodoFilter = 'all' | 'today' | 'completed';
  export type SortBy = 'createdAt' | 'dueDate' | 'title';
  export type SortOrder = 'asc' | 'desc';
  
  export interface TodoQuery {
    filter?: TodoFilter;
    page?: number;
    limit?: number;
    sortBy?: SortBy;
    sortOrder?: SortOrder;
  }
  
  export interface VoiceRecognitionResult {
    transcript: string;
    confidence: number;
    isFinal: boolean;
  }