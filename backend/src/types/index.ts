import { Request } from "express";
import { Types } from "mongoose";

export interface IUser {
  _id?: string | Types.ObjectId;
  email: string;
  password: string;
  preferences: {
    theme: "light" | "dark";
    defaultView: "today" | "all";
  };
  createdAt: Date;
  lastLogin: Date;
}

export interface ITodo {
  _id?: string | Types.ObjectId;
  userId: string;
  title: string;
  description?: string;
  dueDate: Date;
  repeatType: "none" | "daily";
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdVia: "text" | "voice";
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}