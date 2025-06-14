// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { log } from "../config/logger";
import { config } from "../config/config";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error with context
  const errorContext = {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    body: config.isDevelopment ? req.body : undefined,
    params: req.params,
    query: req.query,
    stack: err.stack,
  };

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error.message = "Resource not found";
    error.statusCode = 404;
    log.warn("Mongoose CastError", { ...errorContext, objectId: err.value });
  }
  // Mongoose duplicate key
  else if (err.code === 11000) {
    error.message = "Duplicate field value entered";
    error.statusCode = 400;
    log.warn("Mongoose duplicate key error", {
      ...errorContext,
      duplicateFields: Object.keys(err.keyValue || {}),
    });
  }
  // Mongoose validation error
  else if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(", ");
    error.message = message;
    error.statusCode = 400;
    log.warn("Mongoose validation error", {
      ...errorContext,
      validationErrors: Object.keys(err.errors),
    });
  }
  // JWT errors
  else if (err.name === "JsonWebTokenError") {
    error.message = "Invalid token";
    error.statusCode = 401;
    log.warn("JWT error", errorContext);
  }
  // JWT expired
  else if (err.name === "TokenExpiredError") {
    error.message = "Token expired";
    error.statusCode = 401;
    log.warn("JWT expired", errorContext);
  }
  // Generic server errors
  else {
    // Log as error for 5xx status codes, warn for 4xx
    const statusCode = error.statusCode || 500;
    if (statusCode >= 500) {
      log.error("Server error", { ...errorContext, error: err });
    } else {
      log.warn("Client error", { ...errorContext, error: err.message });
    }
  }

  // Don't expose sensitive error details in production
  const response = {
    success: false,
    message: error.message || "Server Error",
    ...(config.isDevelopment && {
      stack: err.stack,
      error: err,
    }),
  };

  res.status(error.statusCode || 500).json(response);
};
