// src/hooks/useTodos.ts
import { useState } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { 
  useTodosQuery, 
  useCreateTodo, 
  useUpdateTodo, 
  useToggleTodo, 
  useDeleteTodo 
} from '@/hooks/queries/useTodos';
import { queryKeys } from '@/hooks/queries/queryKeys';
import type {
  TodoFilter,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoQuery,
} from "@/types";

export const useTodos = (initialFilter: TodoFilter = "all") => {
  const [filter, setFilter] = useState<TodoFilter>(initialFilter);
  const queryClient = useQueryClient();

  // Query for todos
  const query: TodoQuery = { filter };
  const { data: todos = [], isLoading, error, refetch } = useTodosQuery(query);

  // Mutations
  const createTodoMutation = useCreateTodo();
  const updateTodoMutation = useUpdateTodo();
  const toggleTodoMutation = useToggleTodo();
  const deleteTodoMutation = useDeleteTodo();

  // Filter todos client-side for immediate UI updates
  const filteredTodos = todos.filter((todo) => {
    switch (filter) {
      case "today":
        const today = new Date().toDateString();
        return new Date(todo.dueDate).toDateString() === today;
      case "completed":
        return todo.completed;
      default:
        return true;
    }
  });

  // Wrapper functions for mutations
  const createTodo = async (todoData: CreateTodoRequest): Promise<void> => {
    await createTodoMutation.mutateAsync(todoData);
  };

  const updateTodo = async (id: string, todoData: UpdateTodoRequest): Promise<void> => {
    await updateTodoMutation.mutateAsync({ id, data: todoData });
  };

  const toggleTodo = async (id: string): Promise<void> => {
    await toggleTodoMutation.mutateAsync(id);
  };

  const deleteTodo = async (id: string): Promise<void> => {
    await deleteTodoMutation.mutateAsync(id);
  };

  const clearError = () => {
    // Reset any mutation errors
    createTodoMutation.reset();
    updateTodoMutation.reset();
    toggleTodoMutation.reset();
    deleteTodoMutation.reset();
  };

  const refetchTodos = () => {
    return refetch();
  };

  // Manual cache invalidation for specific filters
  const invalidateFilter = (targetFilter: TodoFilter) => {
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.todoList({ filter: targetFilter }) 
    });
  };

  // Update filter and invalidate cache if needed
  const updateFilter = (newFilter: TodoFilter) => {
    setFilter(newFilter);
    // Prefetch data for the new filter
    queryClient.prefetchQuery({
      queryKey: queryKeys.todoList({ filter: newFilter }),
      queryFn: async () => {
        const response = await import('@/services/api').then(api => 
          api.todoApi.getTodos({ filter: newFilter })
        );
        if (response.success && response.data) {
          return response.data.todos;
        }
        throw new Error('Failed to fetch todos');
      },
    });
  };

  return {
    todos: filteredTodos,
    loading: isLoading,
    error: error?.message || 
           createTodoMutation.error?.message || 
           updateTodoMutation.error?.message || 
           toggleTodoMutation.error?.message || 
           deleteTodoMutation.error?.message,
    filter,
    setFilter: updateFilter,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    refetch: refetchTodos,
    clearError,
    
    // Expose mutation states for more granular loading states
    isCreating: createTodoMutation.isPending,
    isUpdating: updateTodoMutation.isPending,
    isToggling: toggleTodoMutation.isPending,
    isDeleting: deleteTodoMutation.isPending,
    
    // Utility functions
    invalidateFilter,
    prefetchFilter: (targetFilter: TodoFilter) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.todoList({ filter: targetFilter }),
        queryFn: async () => {
          const response = await import('@/services/api').then(api => 
            api.todoApi.getTodos({ filter: targetFilter })
          );
          if (response.success && response.data) {
            return response.data.todos;
          }
          throw new Error('Failed to fetch todos');
        },
      });
    },
  };
};

// Keep the enhanced version as an alias for backward compatibility
export const useEnhancedTodos = useTodos;