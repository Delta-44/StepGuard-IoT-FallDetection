import { Router } from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  updateUserByAdmin,
} from "../controllers/userController";
import authMiddleware from "../middleware/auth";
import adminAuthMiddleware from "../middleware/adminAuth";

const router = Router();

// Get all users (Protected)
router.get("/", authMiddleware, getUsers);

// Get user by ID with device info (Protected)
router.get("/:id", authMiddleware, getUserById);

// Update user by ID (Protected)
router.put("/:id", authMiddleware, updateUser);

// Update user by Admin (Role, Name, Email)
router.put("/:id/admin", authMiddleware, adminAuthMiddleware, updateUserByAdmin);

export default router;
