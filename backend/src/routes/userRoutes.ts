import { Router } from 'express';
import { getUsers } from '../controllers/userController';
import authMiddleware from '../middleware/auth';

const router = Router();

// Get all users (Protected)
router.get('/', authMiddleware, getUsers);

export default router;
