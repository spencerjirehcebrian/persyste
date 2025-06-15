import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import type { CreateTodoRequest } from "@/types";

type TodoFormData = {
  title: string;
  description?: string;
  dueDate?: string;
  repeatType?: "none" | "daily";
  createdVia?: "text" | "voice";
};

export const useTodoInputForm = (
  onSubmit: (data: CreateTodoRequest) => Promise<void>
) => {
  return useForm<TodoFormData>({
    defaultValues: {
      title: "",
      description: "",
      dueDate: new Date().toISOString(),
      repeatType: "none",
      createdVia: "text",
    },
    onSubmit: async ({ value }) => {
      // Validate the form data before submitting
      const result = z
        .object({
          title: z
            .string()
            .min(1, "Todo title is required")
            .max(500, "Todo title must be less than 500 characters"),
          description: z.string().optional(),
          dueDate: z.string().optional(),
          repeatType: z.enum(["none", "daily"]).optional(),
          createdVia: z.enum(["text", "voice"]).optional(),
        })
        .safeParse(value);

      if (!result.success) {
        throw new Error(result.error.issues[0].message);
      }

      await onSubmit(result.data);
    },
  });
};
