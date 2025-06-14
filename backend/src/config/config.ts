// src/config/config.ts
import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables
dotenv.config();

// Environment variables schema
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test", "staging"])
    .default("development"),
  PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(65535))
    .default("5000"),
  MONGO_URI: z.string().url("Invalid MongoDB URI format"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_EXPIRE: z.string().default("7d"),
  FRONTEND_URL: z
    .string()
    .url("Invalid frontend URL")
    .default("http://localhost:3000"),
  RATE_LIMIT_WINDOW: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1))
    .default("15"),
  RATE_LIMIT_MAX: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1))
    .default("100"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "debug"]).default("info"),
});

// Validate environment variables
const validateEnvVars = () => {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:");
      error.errors.forEach((err) => {
        console.error(`   - ${err.path.join(".")}: ${err.message}`);
      });
      console.error(
        "\n💡 Please check your .env file and ensure all required variables are set correctly."
      );
    } else {
      console.error(
        "❌ Unexpected error validating environment variables:",
        error
      );
    }
    process.exit(1);
  }
};

// Get validated environment variables
const env = validateEnvVars();

export const config = {
  // Environment
  env: env.NODE_ENV,
  port: typeof env.PORT === "string" ? parseInt(env.PORT, 10) : env.PORT,

  // Database
  mongoUri: env.MONGO_URI,

  // JWT Configuration
  jwtSecret: env.JWT_SECRET,
  jwtExpire: env.JWT_EXPIRE,

  // CORS Configuration
  frontendUrl: env.FRONTEND_URL,

  // Rate Limiting
  rateLimitWindow:
    typeof env.RATE_LIMIT_WINDOW === "string"
      ? parseInt(env.RATE_LIMIT_WINDOW, 10)
      : env.RATE_LIMIT_WINDOW,
  rateLimitMax:
    typeof env.RATE_LIMIT_MAX === "string"
      ? parseInt(env.RATE_LIMIT_MAX, 10)
      : env.RATE_LIMIT_MAX,

  // Logging
  logLevel: env.LOG_LEVEL,

  // Development flags
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  isStaging: env.NODE_ENV === "staging",
};

// Type for configuration
export type Config = typeof config;
