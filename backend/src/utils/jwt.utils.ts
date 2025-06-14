import jwt from "jsonwebtoken";
import { config } from "../config/config";

export const generateToken = (payload: {
  id: string;
  email: string;
}): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, config.jwtSecret);
};
