// src/components/TodoList.tsx
import React from 'react';
import TodoItem from './TodoItem';
import type { Todo, UpdateTodoRequest } from '@/types';

interface TodoListProps {
  todos: Todo[];
  loading?: boolean;
  onUpdateTodo: (id: string, todo: UpdateTodoRequest) => Promise<void>;
  onToggleTodo: (id: string) => Promise<void>;
  onDeleteTodo: (id: string) => Promise<void>;
}

const TodoList: React.FC<TodoListProps> = ({
  todos,
  loading,
  onUpdateTodo,
  onToggleTodo,
  onDeleteTodo,
}) => {
  if (loading) {
    return (
      <div className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-16"
            />
          ))}
        </div>
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No tasks yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            Add your first task above to get started. You can type or use voice input.
          </p>
        </div>
      </div>
    );
  }

  const completedTodos = todos.filter(todo => todo.completed);
  const incompleteTodos = todos.filter(todo => !todo.completed);

  return (
    <div className="flex-1 px-6 py-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Incomplete todos */}
        {incompleteTodos.length > 0 && (
          <div className="space-y-2">
            {incompleteTodos.map((todo) => (
              <TodoItem
                key={todo._id}
                todo={todo}
                onUpdate={onUpdateTodo}
                onToggle={onToggleTodo}
                onDelete={onDeleteTodo}
              />
            ))}
          </div>
        )}

        {/* Completed todos */}
        {completedTodos.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4">
              Completed ({completedTodos.length})
            </h3>
            {completedTodos.map((todo) => (
              <TodoItem
                key={todo._id}
                todo={todo}
                onUpdate={onUpdateTodo}
                onToggle={onToggleTodo}
                onDelete={onDeleteTodo}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
