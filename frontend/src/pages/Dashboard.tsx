// src/pages/Dashboard.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTodos } from "@/hooks/queries/useTodos";
import Header from "@/components/Header";
import TodoInput from "@/components/TodoInput";
import TodoList from "@/components/TodoList";
import type { TodoFilter } from "@/types";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<TodoFilter>("all");

  const {
    todos,
    loading,
    error,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    setFilter: updateFilter,
  } = useTodos(user?.preferences?.defaultView || "all");

  // Update filter when it changes
  useEffect(() => {
    updateFilter(filter);
  }, [filter, updateFilter]);

  // Set initial filter from user preferences
  useEffect(() => {
    if (user?.preferences?.defaultView && filter === "all") {
      setFilter(user.preferences.defaultView);
    }
  }, [user?.preferences?.defaultView, filter]);

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-red-600 dark:text-red-400 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-150"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header filter={filter} onFilterChange={setFilter} />

      <TodoList
        todos={todos}
        loading={loading}
        onUpdateTodo={updateTodo}
        onToggleTodo={toggleTodo}
        onDeleteTodo={deleteTodo}
      />

      <TodoInput onCreateTodo={createTodo} />
    </div>
  );
};

export default Dashboard;
