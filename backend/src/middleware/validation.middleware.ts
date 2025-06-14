// src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { log } from '../config/logger';

// Interface for file upload requests (using intersection type to avoid conflicts)
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

type FileRequest = Request & {
  file?: MulterFile;
}

// Generic validation middleware
export const validate = (schema: {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate request params
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      // Validate request query
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        log.warn('Validation error', {
          path: req.path,
          method: req.method,
          errors: errorMessages
        });

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages,
        });
        return;
      }

      // Handle unexpected errors
      log.error('Unexpected validation error', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
      });
    }
  };
};

// Helper for body-only validation
export const validateBody = (schema: ZodSchema) => {
  return validate({ body: schema });
};

// Helper for params-only validation  
export const validateParams = (schema: ZodSchema) => {
  return validate({ params: schema });
};

// Helper for query-only validation
export const validateQuery = (schema: ZodSchema) => {
  return validate({ query: schema });
};

// Custom validation for file uploads (if needed)
export const validateFile = (options: {
  required?: boolean;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}) => {
  return (req: FileRequest, res: Response, next: NextFunction): void => {
    const file = req.file;

    if (options.required && !file) {
      res.status(400).json({
        success: false,
        message: 'File is required',
      });
      return;
    }

    if (file) {
      // Check file size
      if (options.maxSize && file.size > options.maxSize) {
        res.status(400).json({
          success: false,
          message: `File size exceeds ${options.maxSize} bytes`,
        });
        return;
      }

      // Check file type
      if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
        res.status(400).json({
          success: false,
          message: `File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`,
        });
        return;
      }
    }

    next();
  };
};

// Rate limiting validation helper
export const validateRateLimit = (identifier: string) => {
  // This would integrate with your rate limiting logic
  return (req: Request, res: Response, next: NextFunction): void => {
    // Implementation depends on your rate limiting strategy
    // For now, just pass through
    next();
  };
};