// src/components/TodoItem.tsx
import React, { useState, useRef, useEffect } from "react";
import { Check, Edit2, Trash2, Mic, Calendar, RotateCcw } from "lucide-react";
import type { Todo, UpdateTodoRequest } from "@/types";

interface TodoItemProps {
  todo: Todo;
  onUpdate: (id: string, todo: UpdateTodoRequest) => Promise<void>;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onUpdate,
  onToggle,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.title);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await onToggle(todo._id);
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(todo.title);
  };

  const handleSaveEdit = async () => {
    const trimmedText = editText.trim();
    if (!trimmedText) return;

    if (trimmedText !== todo.title) {
      try {
        await onUpdate(todo._id, { title: trimmedText });
      } catch (error) {
        console.error("Failed to update todo:", error);
        setEditText(todo.title);
      }
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(todo.title);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await onDelete(todo._id);
      } catch (error) {
        console.error("Failed to delete todo:", error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return "Today";
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = () => {
    const dueDate = new Date(todo.dueDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return dueDate < today && !todo.completed;
  };

  return (
    <div
      className={`group flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border transition-all duration-150 hover:shadow-sm ${
        todo.completed
          ? "border-gray-200 dark:border-gray-700 opacity-60"
          : isOverdue()
          ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all duration-150 ${
          todo.completed
            ? "bg-green-500 border-green-500 text-white"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        } ${loading ? "animate-pulse" : ""}`}
      >
        {todo.completed && <Check className="h-4 w-4" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveEdit}
            className="w-full px-2 py-1 text-base bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 rounded"
          />
        ) : (
          <div>
            <h3
              className={`text-base transition-all duration-150 ${
                todo.completed
                  ? "line-through text-gray-500 dark:text-gray-400"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {todo.title}
            </h3>

            {/* Metadata */}
            <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span
                  className={
                    isOverdue() ? "text-red-600 dark:text-red-400" : ""
                  }
                >
                  {formatDate(todo.dueDate)}
                </span>
              </div>

              {todo.createdVia === "voice" && (
                <div className="flex items-center">
                  <Mic className="h-3 w-3 mr-1" />
                  <span>Voice</span>
                </div>
              )}

              {todo.repeatType === "daily" && (
                <div className="flex items-center">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  <span>Daily</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={handleEdit}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            title="Edit task"
          >
            <Edit2 className="h-4 w-4" />
          </button>

          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
            title="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TodoItem;
