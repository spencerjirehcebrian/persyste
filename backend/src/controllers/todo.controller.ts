import { Response } from "express";
import { Todo } from "../models/todo.model";
import { asyncHandler } from "../utils/async.handler";
import { AuthRequest } from "../types";

export const getTodos = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { filter = "all" } = req.query;
    const userId = req.user?.id;

    let query: any = { userId };

    // Apply filters
    if (filter === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      query = {
        ...query,
        $or: [
          { dueDate: { $gte: startOfDay, $lte: endOfDay } },
          { repeatType: "daily", completed: false },
        ],
      };
    } else if (filter === "completed") {
      query.completed = true;
    }

    const todos = await Todo.find(query).sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: todos.length,
      todos,
    });
  }
);

export const createTodo = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { title, description, dueDate, repeatType, createdVia } = req.body;
    const userId = req.user?.id;

    const todo = await Todo.create({
      userId,
      title,
      description,
      dueDate,
      repeatType,
      createdVia,
    });

    res.status(201).json({
      success: true,
      todo,
    });
  }
);

export const updateTodo = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    let todo = await Todo.findOne({ _id: id, userId });
    if (!todo) {
      res.status(404).json({
        success: false,
        message: "Todo not found",
      });
      return;
    }

    // Update fields
    const allowedUpdates = ["title", "description", "dueDate", "repeatType"];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        (todo as any)[field] = req.body[field];
      }
    });

    await todo.save();

    res.status(200).json({
      success: true,
      todo,
    });
  }
);

export const toggleTodo = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const todo = await Todo.findOne({ _id: id, userId });
    if (!todo) {
      res.status(404).json({
        success: false,
        message: "Todo not found",
      });
      return;
    }

    todo.completed = !todo.completed;
    await todo.save();

    // If it's a daily repeat and just completed, create tomorrow's instance
    if (todo.completed && todo.repeatType === "daily") {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      await Todo.create({
        userId: todo.userId,
        title: todo.title,
        description: todo.description,
        dueDate: tomorrow,
        repeatType: "daily",
        createdVia: todo.createdVia,
      });
    }

    res.status(200).json({
      success: true,
      todo,
    });
  }
);

export const deleteTodo = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const todo = await Todo.findOneAndDelete({ _id: id, userId });
    if (!todo) {
      res.status(404).json({
        success: false,
        message: "Todo not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Todo deleted successfully",
    });
  }
);
