// src/hooks/queries/queryKeys.ts
import type { TodoFilter, SortBy, SortOrder } from '@/types';

export const queryKeys = {
  all: ['persyste'] as const,
  
  // Auth keys
  auth: () => [...queryKeys.all, 'auth'] as const,
  currentUser: () => [...queryKeys.auth(), 'currentUser'] as const,
  
  // Todo keys
  todos: () => [...queryKeys.all, 'todos'] as const,
  todoList: (filters: {
    filter?: TodoFilter;
    page?: number;
    limit?: number;
    sortBy?: SortBy;
    sortOrder?: SortOrder;
  }) => [...queryKeys.todos(), 'list', filters] as const,
  todo: (id: string) => [...queryKeys.todos(), 'detail', id] as const,
  
  // System keys
  system: () => [...queryKeys.all, 'system'] as const,
  health: () => [...queryKeys.system(), 'health'] as const,
  status: () => [...queryKeys.system(), 'status'] as const,
} as const;