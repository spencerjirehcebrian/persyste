import mongoose, { Schema, Document } from "mongoose";
import { ITodo } from "../types";

export interface ITodoDocument extends ITodo, Document {}

const todoSchema = new Schema<ITodoDocument>(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    dueDate: {
      type: Date,
      default: () => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return today;
      },
    },
    repeatType: {
      type: String,
      enum: ["none", "daily"],
      default: "none",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    createdVia: {
      type: String,
      enum: ["text", "voice"],
      default: "text",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
todoSchema.index({ userId: 1, dueDate: -1 });
todoSchema.index({ userId: 1, completed: 1 });

// Update completedAt when todo is marked complete
todoSchema.pre("save", function (next) {
  if (this.isModified("completed")) {
    this.completedAt = this.completed ? new Date() : undefined;
  }
  next();
});

export const Todo = mongoose.model<ITodoDocument>("Todo", todoSchema);
