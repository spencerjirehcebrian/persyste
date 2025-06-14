import dotenv from "dotenv";

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/todoapp",
  jwtSecret: process.env.JWT_SECRET || "default-secret",
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || "15", 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
};
