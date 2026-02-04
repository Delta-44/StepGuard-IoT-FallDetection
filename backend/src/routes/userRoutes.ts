import { Router } from 'express';
import { getUsers, getUserById } from '../controllers/userController';
import authMiddleware from '../middleware/auth';

const router = Router();

// Get all users (Protected)
router.get('/', authMiddleware, getUsers);

// Get user by ID with device info (Protected)
router.get('/:id', authMiddleware, getUserById);

export default router;
