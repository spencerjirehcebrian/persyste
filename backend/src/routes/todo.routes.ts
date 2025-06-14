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
  todoValidation,
  validateRequest,
} from "../middleware/validation.middleware";

const router = Router();

// All routes require authentication
router.use(protect);

router.get("/", getTodos);
router.post("/", todoValidation.create, validateRequest, createTodo);
router.put("/:id", todoValidation.update, validateRequest, updateTodo);
router.patch("/:id/toggle", toggleTodo);
router.delete("/:id", deleteTodo);

export default router;
