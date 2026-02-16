import { Router } from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  updateUserByAdmin,
  deleteUser,
  assignDevice,
  exportUsersCSV,
  uploadProfilePhoto
} from "../controllers/userController";
import authMiddleware from "../middleware/auth";
import adminAuthMiddleware from "../middleware/adminAuth";
import upload from "../middleware/upload";

const router = Router();

// Get all users (Protected)
router.get("/", authMiddleware, getUsers);

// Export users as CSV (Protected)
router.get("/export/csv", authMiddleware, exportUsersCSV);

// Get user by ID with device info (Protected)
router.get("/:id", authMiddleware, getUserById);

// Update user by ID (Protected)
router.put("/:id", authMiddleware, updateUser);

// Update user by Admin (Role, Name, Email)
router.put("/:id/admin", authMiddleware, adminAuthMiddleware, updateUserByAdmin);

// Delete user by ID (Admin only)
router.delete("/:id", authMiddleware, adminAuthMiddleware, deleteUser);

// Assign device to user (Protected)
router.post("/:id/device", authMiddleware, assignDevice);

// Upload profile photo
router.post("/:id/photo", authMiddleware, upload.single('photo'), uploadProfilePhoto);

export default router;
