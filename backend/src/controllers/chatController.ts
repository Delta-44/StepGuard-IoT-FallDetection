import { Request, Response } from 'express';
import { AIService } from '../services/aiService';

export const ChatController = {
    /**
     * Handle incoming chat messages from the frontend.
     */
    sendMessage: async (req: Request, res: Response) => {
        try {
            const { message } = req.body;

            if (!message) {
                res.status(400).json({ error: 'Message is required' });
                return;
            }

            console.log(`[ChatController] Received message: "${message}"`);

            // Use AI Service to process the query with user context
            const userContext = (req as any).user;
            const reply = await AIService.processQuery(message, userContext);

            res.json({ reply });

        } catch (error: any) {
            console.error('[ChatController] Error:', error);
            res.status(500).json({ error: 'Internal Server Error processing chat message' });
        }
    },
    
    /**
     * Clear chat history for the authenticated user.
     */
    clearHistory: async (req: Request, res: Response) => {
        try {
            const userContext = (req as any).user;
            
            if (!userContext || !userContext.id) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            
            const { ChatHistoryService } = await import('../services/chatHistoryService');
            await ChatHistoryService.clearHistory(userContext.id);
            
            console.log(`[ChatController] Cleared history for user ${userContext.id}`);
            res.json({ message: 'Chat history cleared' });
            
        } catch (error: any) {
            console.error('[ChatController] Error clearing history:', error);
            res.status(500).json({ error: 'Internal Server Error clearing history' });
        }
    }
};
