// src/components/TodoInput.tsx
import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Send } from "lucide-react";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTodoInputForm } from "@/hooks/forms/useTodoInputForm";
import type { CreateTodoRequest } from "@/types";

interface TodoInputProps {
  onCreateTodo: (todo: CreateTodoRequest) => Promise<void>;
  loading?: boolean;
}

const TodoInput: React.FC<TodoInputProps> = ({
  onCreateTodo,
  loading = false,
}) => {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const form = useTodoInputForm(async (data) => {
    try {
      await onCreateTodo(data);
      // Reset form after successful submission
      form.reset();
      setIsVoiceMode(false);
      resetTranscript();
      inputRef.current?.focus();
    } catch (error) {
      console.error("Failed to create todo:", error);
    }
  });

  const {
    isListening,
    transcript,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    continuous: false,
    interimResults: true,
    onResult: (result) => {
      if (result.isFinal) {
        form.setFieldValue("title", result.transcript.trim());
        form.setFieldValue("createdVia", "voice");
        setIsVoiceMode(false);
      }
    },
    onError: (error) => {
      console.error("Voice recognition error:", error);
      setIsVoiceMode(false);
    },
  });

  useKeyboardShortcuts([
    {
      key: " ",
      callback: () => {
        if (
          isVoiceSupported &&
          !isListening &&
          form.getFieldValue("title") === ""
        ) {
          handleVoiceToggle();
        }
      },
    },
  ]);

  useEffect(() => {
    if (isVoiceMode && transcript) {
      form.setFieldValue("title", transcript);
    }
  }, [transcript, isVoiceMode, form]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      setIsVoiceMode(false);
    } else {
      resetTranscript();
      form.setFieldValue("title", "");
      form.setFieldValue("createdVia", "voice");
      setIsVoiceMode(true);
      startListening();
    }
  };

  const handleInputChange = (value: string) => {
    form.setFieldValue("title", value);
    if (isVoiceMode) {
      form.setFieldValue("createdVia", "text");
      setIsVoiceMode(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex items-center space-x-3"
        >
          <form.Field
            name="title"
            children={(field) => (
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    handleInputChange(e.target.value);
                  }}
                  onBlur={field.handleBlur}
                  placeholder={
                    isVoiceMode
                      ? isListening
                        ? "Listening..."
                        : "Voice mode active"
                      : "Add a new task..."
                  }
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-150 ${
                    isVoiceMode
                      ? "border-blue-300 dark:border-blue-600 focus:ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600 focus:ring-gray-900 dark:focus:ring-gray-100"
                  } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800`}
                  disabled={loading}
                />

                {isVoiceSupported && (
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-colors duration-150 ${
                      isListening
                        ? "text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
                        : isVoiceMode
                        ? "text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    }`}
                    title={
                      isListening
                        ? "Stop listening"
                        : "Start voice input (Spacebar)"
                    }
                  >
                    {isListening ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            )}
          />

          <button
            type="submit"
            disabled={loading || form.state.isSubmitting}
            className="p-3 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            title="Add todo (Enter)"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>

        {isVoiceSupported && !isVoiceMode && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Press spacebar or tap the mic to use voice input
          </p>
        )}
      </div>
    </div>
  );
};

export default TodoInput;
