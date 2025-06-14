// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { User } from "../models/user.model";
import { generateToken } from "../utils/jwt.utils";
import { asyncHandler } from "../utils/async.handler";
import { AuthRequest } from "../types";
import { log } from "../config/logger";
import { RegisterInput, LoginInput, UpdatePreferencesInput } from "../schemas";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password }: RegisterInput = req.body;

  log.info("User registration attempt", { email });

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    log.warn("Registration failed - user already exists", { email });
    res.status(400).json({
      success: false,
      message: "User already exists",
    });
    return;
  }

  try {
    // Create user
    const user = await User.create({
      email,
      password,
    });

    // Generate token
    const token = generateToken({
      id: (user._id as string).toString(),
      email: user.email,
    });

    log.info("User registered successfully", {
      userId: user._id,
      email: user.email,
    });

    // Send response
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    log.error("User registration failed", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password }: LoginInput = req.body;

  log.info("User login attempt", { email });

  // Check for user
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    log.warn("Login failed - user not found", { email });
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
    return;
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    log.warn("Login failed - invalid password", {
      email,
      userId: user._id,
    });
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
    return;
  }

  try {
    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken({
      id: (user._id as string).toString(),
      email: user.email,
    });

    log.info("User logged in successfully", {
      userId: user._id,
      email: user.email,
    });

    // Send response
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    log.error("Login process failed", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  log.debug("Get user profile request", { userId });

  const user = await User.findById(userId);

  if (!user) {
    log.warn("User profile not found", { userId });
    res.status(404).json({
      success: false,
      message: "User not found",
    });
    return;
  }

  log.debug("User profile retrieved successfully", { userId });

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      email: user.email,
      preferences: user.preferences,
    },
  });
});

export const updatePreferences = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { theme, defaultView }: UpdatePreferencesInput = req.body;
    const userId = req.user?.id;

    log.info("Update user preferences request", {
      userId,
      updates: { theme, defaultView },
    });

    const user = await User.findById(userId);
    if (!user) {
      log.warn("User not found for preferences update", { userId });
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    try {
      // Update preferences
      if (theme) user.preferences.theme = theme;
      if (defaultView) user.preferences.defaultView = defaultView;

      await user.save();

      log.info("User preferences updated successfully", {
        userId,
        newPreferences: user.preferences,
      });

      res.status(200).json({
        success: true,
        preferences: user.preferences,
      });
    } catch (error) {
      log.error("Failed to update user preferences", error);
      res.status(500).json({
        success: false,
        message: "Failed to update preferences",
      });
    }
  }
);