import { Request, Response } from "express";
import { User } from "../models/user.model";
import { generateToken } from "../utils/jwt.utils";
import { asyncHandler } from "../utils/async.handler";
import { AuthRequest } from "../types";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).json({
      success: false,
      message: "User already exists",
    });
    return;
  }

  // Create user
  const user = await User.create({
    email,
    password,
  });

  // Generate token
  const token = generateToken({
    id: user._id.toString(),
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
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
    return;
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
    return;
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken({
    id: user._id.toString(),
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
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?.id);

  if (!user) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
    return;
  }

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
    const { theme, defaultView } = req.body;

    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (theme) user.preferences.theme = theme;
    if (defaultView) user.preferences.defaultView = defaultView;

    await user.save();

    res.status(200).json({
      success: true,
      preferences: user.preferences,
    });
  }
);
