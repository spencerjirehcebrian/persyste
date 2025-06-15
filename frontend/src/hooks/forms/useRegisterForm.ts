import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import type { RegisterRequest } from '@/types';

export const useRegisterForm = (onSubmit: (data: RegisterRequest) => Promise<void>) => {
  return useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      // Validate the entire form before submitting
      const result = z.object({
        email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
        password: z.string()
          .min(8, 'Password must be at least 8 characters')
          .max(128, 'Password must be less than 128 characters')
          .regex(/[a-z]/, 'Password must contain a lowercase letter')
          .regex(/[A-Z]/, 'Password must contain an uppercase letter')
          .regex(/[0-9]/, 'Password must contain a number'),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      }).safeParse(value);

      if (!result.success) {
        throw new Error(result.error.issues[0].message);
      }

      const { email, password } = result.data;
      await onSubmit({ email, password });
    },
  });
};