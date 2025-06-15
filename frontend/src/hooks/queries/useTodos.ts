// src/hooks/queries/useTodos.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { todoApi } from "@/services/api";
import { logger } from "@/utils/logger";
import type {
  Todo,
  TodoQuery,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoFilter,
} from "@/types";
import { queryKeys } from "./queryKeys";

// Query for todos list
export const useTodosQuery = (query: TodoQuery = {}) => {
  return useQuery({
    queryKey: queryKeys.todoList(query),
    queryFn: async () => {
      const response = await todoApi.getTodos(query);
      if (response.success && response.data) {
        return response.data.todos;
      }
      throw new Error("Failed to fetch todos");
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Create todo mutation
export const useCreateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (todoData: CreateTodoRequest) => {
      logger.logUserAction("Creating todo", {
        title: todoData.title,
        createdVia: todoData.createdVia,
      });

      const response = await todoApi.createTodo(todoData);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error("Failed to create todo");
    },
    onMutate: async (newTodo) => {
      // Create a temporary ID for optimistic update
      const tempId = `temp_${Date.now()}`;
      const tempTodo: Todo = {
        _id: tempId,
        userId: "temp",
        title: newTodo.title,
        description: newTodo.description,
        dueDate: newTodo.dueDate || new Date().toISOString(),
        repeatType: newTodo.repeatType || "none",
        completed: false,
        createdVia: newTodo.createdVia || "text",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.todos() });

      // Get all current todo queries and update them
      const queries = queryClient.getQueriesData({
        queryKey: queryKeys.todos(),
      });
      const previousQueries: Array<{ queryKey: any; data: any }> = [];

      queries.forEach(([queryKey, data]) => {
        if (data && Array.isArray(data)) {
          previousQueries.push({ queryKey, data });
          queryClient.setQueryData(queryKey, [tempTodo, ...data]);
        }
      });

      return { tempId, previousQueries };
    },
    onSuccess: (newTodo, variables, context) => {
      // Remove the temporary todo and add the real one
      if (context?.previousQueries) {
        context.previousQueries.forEach(({ queryKey }) => {
          const currentData = queryClient.getQueryData<Todo[]>(queryKey);
          if (currentData) {
            const updatedData = currentData.map((todo) =>
              todo._id === context.tempId ? newTodo : todo
            );
            queryClient.setQueryData(queryKey, updatedData);
          }
        });
      }

      logger.info("Todo created successfully", {
        id: newTodo._id,
        title: newTodo.title,
      });
    },
    onError: (error, variables, context) => {
      // Restore previous state
      if (context?.previousQueries) {
        context.previousQueries.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      logger.error("Failed to create todo", {
        error: error instanceof Error ? error.message : "Unknown error",
        title: variables.title,
      });
    },
    onSettled: () => {
      // Refetch todos to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.todos() });
    },
  });
};

// Update todo mutation
export const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTodoRequest;
    }) => {
      logger.logUserAction("Updating todo", { id, ...data });
      const response = await todoApi.updateTodo(id, data);

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error("Failed to update todo");
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos() });

      const queries = queryClient.getQueriesData({
        queryKey: queryKeys.todos(),
      });
      const previousQueries: Array<{ queryKey: any; data: any }> = [];

      queries.forEach(([queryKey, queryData]) => {
        if (queryData && Array.isArray(queryData)) {
          previousQueries.push({ queryKey, data: queryData });
          const updatedData = queryData.map((todo) =>
            todo._id === id
              ? { ...todo, ...data, updatedAt: new Date().toISOString() }
              : todo
          );
          queryClient.setQueryData(queryKey, updatedData);
        }
      });

      return { previousQueries };
    },
    onSuccess: (updatedTodo) => {
      // Update all relevant queries with the real updated todo
      const queries = queryClient.getQueriesData({
        queryKey: queryKeys.todos(),
      });

      queries.forEach(([queryKey, data]) => {
        if (data && Array.isArray(data)) {
          const updatedData = data.map((todo) =>
            todo._id === updatedTodo._id ? updatedTodo : todo
          );
          queryClient.setQueryData(queryKey, updatedData);
        }
      });

      logger.info("Todo updated successfully", { id: updatedTodo._id });
    },
    onError: (error, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      logger.error("Failed to update todo", {
        error: error instanceof Error ? error.message : "Unknown error",
        id: variables.id,
      });
    },
  });
};

// Toggle todo mutation
export const useToggleTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.logUserAction("Toggling todo", { id });
      const response = await todoApi.toggleTodo(id);

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error("Failed to toggle todo");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos() });

      const queries = queryClient.getQueriesData({
        queryKey: queryKeys.todos(),
      });
      const previousQueries: Array<{ queryKey: any; data: any }> = [];

      queries.forEach(([queryKey, data]) => {
        if (data && Array.isArray(data)) {
          previousQueries.push({ queryKey, data });
          const updatedData = data.map((todo) =>
            todo._id === id
              ? {
                  ...todo,
                  completed: !todo.completed,
                  completedAt: !todo.completed
                    ? new Date().toISOString()
                    : undefined,
                  updatedAt: new Date().toISOString(),
                }
              : todo
          );
          queryClient.setQueryData(queryKey, updatedData);
        }
      });

      return { previousQueries };
    },
    onSuccess: (updatedTodo) => {
      const queries = queryClient.getQueriesData({
        queryKey: queryKeys.todos(),
      });

      queries.forEach(([queryKey, data]) => {
        if (data && Array.isArray(data)) {
          const updatedData = data.map((todo) =>
            todo._id === updatedTodo._id ? updatedTodo : todo
          );
          queryClient.setQueryData(queryKey, updatedData);
        }
      });

      logger.info("Todo toggled successfully", { id: updatedTodo._id });
    },
    onError: (error, id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      logger.error("Failed to toggle todo", {
        error: error instanceof Error ? error.message : "Unknown error",
        id,
      });
    },
  });
};

// Delete todo mutation
export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.logUserAction("Deleting todo", { id });
      await todoApi.deleteTodo(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos() });

      const queries = queryClient.getQueriesData({
        queryKey: queryKeys.todos(),
      });
      const previousQueries: Array<{ queryKey: any; data: any }> = [];

      queries.forEach(([queryKey, data]) => {
        if (data && Array.isArray(data)) {
          previousQueries.push({ queryKey, data });
          const updatedData = data.filter((todo) => todo._id !== id);
          queryClient.setQueryData(queryKey, updatedData);
        }
      });

      return { previousQueries };
    },
    onSuccess: (id) => {
      logger.info("Todo deleted successfully", { id });
    },
    onError: (error, id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      logger.error("Failed to delete todo", {
        error: error instanceof Error ? error.message : "Unknown error",
        id,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos() });
    },
  });
};

// Custom hook that combines queries and provides filtered data
export const useTodosWithFilter = (filter: TodoFilter = "all") => {
  const { data: todos = [], isLoading, error } = useTodosQuery({ filter });

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

  return {
    todos: filteredTodos,
    isLoading,
    error,
  };
};
