import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import type { LoginRequest } from '@/types';

export const useLoginForm = (onSubmit: (data: LoginRequest) => Promise<void>) => {
  return useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      // Validate the entire form before submitting
      const result = z.object({
        email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
        password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
      }).safeParse(value);

      if (!result.success) {
        throw new Error(result.error.issues[0].message);
      }

      await onSubmit(result.data);
    },
  });
};
