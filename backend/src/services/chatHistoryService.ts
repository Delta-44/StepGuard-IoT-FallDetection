import redis from '../config/redis';
import OpenAI from 'openai';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string | null;
    tool_calls?: any[];
    tool_call_id?: string;
    name?: string;
}

export class ChatHistoryService {
    private static readonly HISTORY_KEY_PREFIX = 'chat:history:';
    private static readonly MAX_HISTORY_LENGTH = 20; // Keep last 20 messages (10 turns)
    private static readonly HISTORY_TTL = 86400; // 24 hours in seconds

    /**
     * Get chat history for a user.
     * @param userId The ID of the user.
     * @returns Array of chat messages.
     */
    static async getHistory(userId: number): Promise<ChatMessage[]> {
        try {
            const key = `${this.HISTORY_KEY_PREFIX}${userId}`;
            const historyJson = await redis.lrange(key, 0, -1);
            
            // Redis stores lists in insertion order (if using rpush). 
            // We want oldest first, newest last for the LLM context.
            // If we store with rpush, lrange(0, -1) gives [msg1, msg2, ...]. This is correct.
            
            return historyJson.map(msg => JSON.parse(msg));
        } catch (error) {
            console.error('[ChatHistoryService] Error getting history:', error);
            return [];
        }
    }

    /**
     * Add a message to the user's chat history.
     * @param userId The ID of the user.
     * @param message The message object to add.
     */
    static async addToHistory(userId: number, message: ChatMessage): Promise<void> {
        try {
            const key = `${this.HISTORY_KEY_PREFIX}${userId}`;
            const messageJson = JSON.stringify(message);

            // Use multi to perform operations atomically
            const multi = redis.multi();
            
            // Push to the end of the list
            multi.rpush(key, messageJson);
            
            // Trim to keep only the last N messages
            // ltrim start stop. To keep last N: start = -N, stop = -1. 
            // BUT: Redis LTRIM is 0-based index. 
            // If we want to keep last MAX_HISTORY_LENGTH, we can doing it like this:
            // We can just query length and pop from left if needed, or use ltrim.
            // correct ltrim for "keep last N" is confusing in redis sometimes.
            // Let's safe approach: 
            // LTRIM key -MAX_HISTORY_LENGTH -1
            // This keeps elements from index (Length - Max) to end.
            multi.ltrim(key, -this.MAX_HISTORY_LENGTH, -1);
            
            // Set expiration
            multi.expire(key, this.HISTORY_TTL);

            await multi.exec();

        } catch (error) {
            console.error('[ChatHistoryService] Error adding to history:', error);
        }
    }

    /**
     * Add multiple messages to history (e.g. user query + AI response)
     */
    static async addMessages(userId: number, messages: ChatMessage[]): Promise<void> {
        try {
            const key = `${this.HISTORY_KEY_PREFIX}${userId}`;
            const multi = redis.multi();
            
            for (const msg of messages) {
                multi.rpush(key, JSON.stringify(msg));
            }
            
            multi.ltrim(key, -this.MAX_HISTORY_LENGTH, -1);
            multi.expire(key, this.HISTORY_TTL);
            
            await multi.exec();
        } catch (error) {
            console.error('[ChatHistoryService] Error adding messages:', error);
        }
    }

    /**
     * Clear chat history for a user.
     * @param userId The ID of the user.
     */
    static async clearHistory(userId: number): Promise<void> {
        try {
            const key = `${this.HISTORY_KEY_PREFIX}${userId}`;
            await redis.del(key);
        } catch (error) {
            console.error('[ChatHistoryService] Error clearing history:', error);
        }
    }
}
