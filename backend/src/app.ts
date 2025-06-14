// src/app.ts
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB, isConnected, getConnectionInfo } from "./config/database";
import { config } from "./config/config";
import { log, logRequest } from "./config/logger";
import { errorHandler } from "./middleware/error.middleware";
import authRoutes from "./routes/auth.routes";
import todoRoutes from "./routes/todo.routes";

// Initialize express app
const app: Application = express();

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request when response finishes
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logRequest(req, res, responseTime);
  });
  
  next();
});

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindow * 60 * 1000,
  limit: config.rateLimitMax,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    log.warn("Rate limit exceeded", {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      message: "Too many requests from this IP, please try again later.",
    });
  }
});
app.use("/api/", limiter);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  const dbConnected = isConnected();
  const connectionInfo = getConnectionInfo();
  
  const healthData = {
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: config.env,
    database: {
      connected: dbConnected,
      status: connectionInfo.readyState,
      host: connectionInfo.host,
      name: connectionInfo.name,
    },
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
    },
  };

  if (!dbConnected) {
    log.warn("Health check failed - database not connected");
  }
  
  res.status(dbConnected ? 200 : 503).json(healthData);
});

// Database status endpoint
app.get("/api/status", (req: Request, res: Response) => {
  const connectionInfo = getConnectionInfo();
  
  const statusData = {
    success: connectionInfo.isConnected,
    database: connectionInfo,
    server: {
      environment: config.env,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  };

  res.status(connectionInfo.isConnected ? 200 : 503).json(statusData);
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  log.warn("Route not found", { 
    path: req.originalUrl, 
    method: req.method,
    ip: req.ip
  });

  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Error handler
app.use(errorHandler);

// Initialize server
const startServer = async () => {
  try {
    // Connect to database first
    await connectDB();
    
    // Start server
    const PORT = config.port;
    app.listen(PORT, () => {
      log.info(`🚀 Server running in ${config.env} mode on port ${PORT}`, {
        port: PORT,
        environment: config.env,
        nodeVersion: process.version,
        pid: process.pid
      });

      if (config.isDevelopment) {
        log.info("📖 API Documentation endpoints:", {
          health: `http://localhost:${PORT}/health`,
          status: `http://localhost:${PORT}/api/status`,
          auth: `http://localhost:${PORT}/api/auth`,
          todos: `http://localhost:${PORT}/api/todos`
        });
      }
    });
  } catch (error) {
    log.error("❌ Failed to start server", error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  log.info(`📡 ${signal} received, shutting down gracefully...`, { signal });
  
  // Give ongoing requests time to finish
  setTimeout(() => {
    log.info("🔌 Server closed");
    process.exit(0);
  }, 1000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  log.error("❌ Unhandled Promise Rejection", err);
  if (config.isProduction) {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  log.error("❌ Uncaught Exception", err);
  process.exit(1);
});

// Start the server
startServer();