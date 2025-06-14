// src/routes/todo.routes.ts
import { Router } from "express";
import {
  getTodos,
  createTodo,
  updateTodo,
  toggleTodo,
  deleteTodo,
} from "../controllers/todo.controller";
import { protect } from "../middleware/auth.middleware";
import {
  validate,
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validation.middleware";
import {
  createTodoSchema,
  updateTodoSchema,
  todoQuerySchema,
  paramIdSchema,
} from "../schemas";

const router = Router();

// All routes require authentication
router.use(protect);

// GET /api/todos - Get todos with query filtering
router.get("/", validateQuery(todoQuerySchema), getTodos);

// POST /api/todos - Create new todo
router.post("/", validateBody(createTodoSchema), createTodo);

// PUT /api/todos/:id - Update todo
router.put(
  "/:id",
  validate({
    params: paramIdSchema,
    body: updateTodoSchema,
  }),
  updateTodo
);

// PATCH /api/todos/:id/toggle - Toggle todo completion
router.patch("/:id/toggle", validateParams(paramIdSchema), toggleTodo);

// DELETE /api/todos/:id - Delete todo
router.delete("/:id", validateParams(paramIdSchema), deleteTodo);

export default router;
