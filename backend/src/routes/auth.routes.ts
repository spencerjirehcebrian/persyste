import { Router } from "express";
import {
  register,
  login,
  getMe,
  updatePreferences,
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import {
  authValidation,
  validateRequest,
} from "../middleware/validation.middleware";

const router = Router();

router.post("/register", authValidation.register, validateRequest, register);
router.post("/login", authValidation.login, validateRequest, login);
router.get("/me", protect, getMe);
router.patch("/preferences", protect, updatePreferences);

export default router;
