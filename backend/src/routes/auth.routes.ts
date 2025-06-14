// src/routes/auth.routes.ts
import { Router } from "express";
import {
  register,
  login,
  getMe,
  updatePreferences,
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import {
  registerSchema,
  loginSchema,
  updatePreferencesSchema,
} from "../schemas";

const router = Router();

// Public routes
router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);

// Protected routes
router.get("/me", protect, getMe);
router.patch(
  "/preferences",
  protect,
  validateBody(updatePreferencesSchema),
  updatePreferences
);

export default router;
