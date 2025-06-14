// src/schemas/index.ts
import { z } from 'zod';

// Common schemas
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  );

// Auth schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  defaultView: z.enum(['today', 'all']).optional(),
}).refine(
  (data) => data.theme !== undefined || data.defaultView !== undefined,
  'At least one preference field must be provided'
);

// Todo schemas  
export const createTodoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  dueDate: z
    .string()
    .datetime('Invalid date format')
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  repeatType: z.enum(['none', 'daily']).default('none'),
  createdVia: z.enum(['text', 'voice']).default('text'),
});

export const updateTodoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title cannot exceed 200 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  dueDate: z
    .string()
    .datetime('Invalid date format')
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  repeatType: z.enum(['none', 'daily']).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
);

export const todoQuerySchema = z.object({
  filter: z.enum(['all', 'today', 'completed']).default('all'),
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1))
    .default('1'),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .default('20'),
  sortBy: z.enum(['createdAt', 'dueDate', 'title']).default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const paramIdSchema = z.object({
  id: objectIdSchema,
});

// Type inference for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type TodoQueryInput = z.infer<typeof todoQuerySchema>;
export type ParamIdInput = z.infer<typeof paramIdSchema>;