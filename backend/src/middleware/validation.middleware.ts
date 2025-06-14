import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array(),
    });
    return;
  }
  next();
};

export const authValidation = {
  register: [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }).trim(),
  ],
  login: [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ],
};

export const todoValidation = {
  create: [
    body("title").notEmpty().trim().isLength({ max: 200 }),
    body("description").optional().trim().isLength({ max: 1000 }),
    body("dueDate").optional().isISO8601(),
    body("repeatType").optional().isIn(["none", "daily"]),
    body("createdVia").optional().isIn(["text", "voice"]),
  ],
  update: [
    body("title").optional().trim().isLength({ max: 200 }),
    body("description").optional().trim().isLength({ max: 1000 }),
    body("dueDate").optional().isISO8601(),
    body("repeatType").optional().isIn(["none", "daily"]),
  ],
};
