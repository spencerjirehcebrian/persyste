// src/config/database.ts
import mongoose from "mongoose";
import { config } from "./config";
import { log } from "./logger";

// Connection options for hosted MongoDB
const connectionOptions: mongoose.ConnectOptions = {
  // Connection timeout (30 seconds)
  serverSelectionTimeoutMS: 30000,
  // Socket timeout (45 seconds)
  socketTimeoutMS: 45000,
  // Connection pool settings
  maxPoolSize: 10,
  minPoolSize: 2,
  // Automatically close connections after 30 seconds of inactivity
  maxIdleTimeMS: 30000,
  // Buffer commands when disconnected
  bufferCommands: false,
  // Use IPv4, skip trying IPv6
  family: 4,
};

export const connectDB = async (): Promise<void> => {
  try {
    log.info("🔄 Connecting to MongoDB...");
    
    // Validate MongoDB URI
    if (!config.mongoUri || config.mongoUri === "mongodb://localhost:27017/todoapp") {
      log.warn("⚠️  Warning: Using default MongoDB URI. Please set MONGO_URI in your environment variables.");
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(config.mongoUri, connectionOptions);

    log.info("✅ MongoDB connected successfully!", {
      host: conn.connection.host,
      database: conn.connection.name,
      readyState: getConnectionState(conn.connection.readyState)
    });

    // Test the connection with a simple ping
    await testConnection();
    
  } catch (error) {
    log.error("❌ MongoDB connection error", error);
    
    if (error instanceof Error) {
      // Provide helpful error messages for common issues
      if (error.message.includes("ENOTFOUND")) {
        log.error("💡 Tip: Check your MongoDB URI and internet connection");
      } else if (error.message.includes("authentication failed")) {
        log.error("💡 Tip: Check your MongoDB username and password");
      } else if (error.message.includes("serverSelectionTimeoutMS")) {
        log.error("💡 Tip: MongoDB server might be unreachable or down");
      }
    }
    
    // Exit the process if we can't connect to the database
    process.exit(1);
  }
};

// Test database connection with a simple operation
const testConnection = async (): Promise<void> => {
  try {
    // Check if database connection exists before pinging
    if (!mongoose.connection.db) {
      throw new Error("Database connection not established");
    }
    
    // Ping the database to ensure it's responsive
    await mongoose.connection.db.admin().ping();
    log.info("🏓 Database ping successful - connection is healthy");
  } catch (error) {
    log.error("❌ Database ping failed", error);
    throw error;
  }
};

// Helper function to get human-readable connection state
const getConnectionState = (state: number): string => {
  const states = {
    0: "Disconnected",
    1: "Connected", 
    2: "Connecting",
    3: "Disconnecting"
  };
  return states[state as keyof typeof states] || "Unknown";
};

// Connection event listeners
mongoose.connection.on("connected", () => {
  log.info("🟢 Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  log.error("🔴 Mongoose connection error", err);
});

mongoose.connection.on("disconnected", () => {
  log.warn("🟡 Mongoose disconnected from MongoDB");
});

// Graceful shutdown handling
const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    log.info("🔌 MongoDB connection closed through app termination");
    process.exit(0);
  } catch (error) {
    log.error("❌ Error during MongoDB disconnection", error);
    process.exit(1);
  }
};

process.on("SIGINT", closeConnection);
process.on("SIGTERM", closeConnection);

// Export connection status checker
export const isConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

// Export function to get connection info
export const getConnectionInfo = () => {
  const conn = mongoose.connection;
  return {
    isConnected: conn.readyState === 1,
    host: conn.host,
    name: conn.name,
    readyState: getConnectionState(conn.readyState),
    models: Object.keys(conn.models)
  };
};