import { Router } from 'express';
import { ChatController } from '../controllers/chatController';
import authMiddleware from '../middleware/auth';

const router = Router();

// Endpoint to send a message to the AI
// Protected by authMiddleware to ensure only logged-in users can chat
router.post('/', authMiddleware, ChatController.sendMessage);

// Endpoint to clear chat history
router.delete('/history', authMiddleware, ChatController.clearHistory);

export default router;
