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

            // Use AI Service to process the query
            const reply = await AIService.processQuery(message);

            res.json({ reply });

        } catch (error: any) {
            console.error('[ChatController] Error:', error);
            res.status(500).json({ error: 'Internal Server Error processing chat message' });
        }
    }
};
