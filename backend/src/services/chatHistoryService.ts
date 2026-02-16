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
    private static readonly MAX_HISTORY_LENGTH = 20; // Mantener últimos 20 mensajes (10 turnos)
    private static readonly HISTORY_TTL = 86400; // 24 horas en segundos

    /**
     * Obtener historial de chat para un usuario.
     * @param userId El ID del usuario.
     * @returns Arreglo de mensajes de chat.
     */
    static async getHistory(userId: number): Promise<ChatMessage[]> {
        try {
            const key = `${this.HISTORY_KEY_PREFIX}${userId}`;
            const historyJson = await redis.lrange(key, 0, -1);

            // Redis almacena listas en orden de inserción (si se usa rpush).
            // Queremos el más antiguo primero, el más nuevo al final para el contexto del LLM.
            // Si almacenamos con rpush, lrange(0, -1) da [msg1, msg2, ...]. Esto es correcto.

            return historyJson.map(msg => JSON.parse(msg));
        } catch (error) {
            console.error('[ChatHistoryService] Error getting history:', error);
            return [];
        }
    }

    /**
     * Agregar un mensaje al historial de chat del usuario.
     * @param userId El ID del usuario.
     * @param message El objeto mensaje a agregar.
     */
    static async addToHistory(userId: number, message: ChatMessage): Promise<void> {
        try {
            const key = `${this.HISTORY_KEY_PREFIX}${userId}`;
            const messageJson = JSON.stringify(message);

            // Usar multi para realizar operaciones atómicamente
            const multi = redis.multi();

            // Agregar al final de la lista

            // Recortar para mantener solo los últimos N mensajes
            // ltrim start stop. Para mantener últimos N: start = -N, stop = -1.
            // PERO: Redis LTRIM usa índice base-0.
            // Si queremos mantener MAX_HISTORY_LENGTH, podemos hacerlo así:
            // Simplemente consultamos longitud y sacamos de la izquierda si es necesario, o usamos ltrim.
            // Ltrim correcto para "mantener últimos N" es confuso en redis a veces.
            // Enfoque seguro:
            // LTRIM key -MAX_HISTORY_LENGTH -1
            // Esto mantiene elementos desde el índice (Longitud - Max) hasta el final.
            multi.ltrim(key, -this.MAX_HISTORY_LENGTH, -1);

            // Establecer expiración
            multi.expire(key, this.HISTORY_TTL);

            await multi.exec();

        } catch (error) {
            console.error('[ChatHistoryService] Error adding to history:', error);
        }
    }

    /**
     * Agregar múltiples mensajes al historial (ej. consulta usuario + respuesta IA)
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
     * Limpiar historial de chat para un usuario.
     * @param userId El ID del usuario.
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
