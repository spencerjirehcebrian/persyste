// src/hooks/queries/index.ts

// Export query keys
export { queryKeys } from "./queryKeys";

// Export auth hooks
export {
  useCurrentUser,
  useLogin,
  useRegister,
  useUpdatePreferences,
  useLogout,
} from "./useAuth";

// Export todo hooks
export {
  useTodosQuery,
  useCreateTodo,
  useUpdateTodo,
  useToggleTodo,
  useDeleteTodo,
  useTodosWithFilter,
} from "./useTodos";

// Export system hooks
export { useHealthCheck, useApiStatus, useSystemHealth } from "./useSystem";

// Export form hooks
export { useLoginForm } from "../forms/useLoginForm";
export { useRegisterForm } from "../forms/useRegisterForm";
export { useTodoInputForm } from "../forms/useTodoInputForm";
