import jwt from "jsonwebtoken";
import { config } from "../config/config";

export interface JwtPayload {
  id: string;
  email: string;
}

export const generateToken = (payload: JwtPayload): string => {
  if (!config.jwtSecret || config.jwtSecret === "default-secret") {
    throw new Error("JWT_SECRET must be set in environment variables");
  }
  
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

export const verifyToken = (token: string): JwtPayload => {
  if (!config.jwtSecret || config.jwtSecret === "default-secret") {
    throw new Error("JWT_SECRET must be set in environment variables");
  }
  
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
};