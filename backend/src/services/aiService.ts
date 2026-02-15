import OpenAI from 'openai';
import { McpClientService } from './mcpClientService';
import dotenv from 'dotenv';

dotenv.config();

// Configuration for OpenRouter
const OPENROUTER_API_KEY = process.env.MCP_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL_NAME = 'google/gemini-2.0-flash-001';

if (!OPENROUTER_API_KEY) {
    console.warn('WARNING: MCP_API_KEY is not set. AI Service will not function correctly.');
}

const client = new OpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": "https://stepguard-iot.com",
        "X-Title": "StepGuard IoT",
    }
});

export class AIService {

    /**
     * Process a user query using OpenRouter LLM and internal tools via MCP.
     * @param userQuery The question or command from the user.
     * @returns The natural language response from the AI.
     */
    static async processQuery(userQuery: string, userContext?: { id: number, role: string }): Promise<string> {
        try {
            // 0. Initialize History (if user is authenticated)
            const userId = userContext?.id;
            let history: any[] = [];
            
            if (userId) {
                const { ChatHistoryService } = await import('./chatHistoryService');
                history = await ChatHistoryService.getHistory(userId);
            }

            // 1. Initialize MCP Client
            const mcpClient = McpClientService.getInstance();
            await mcpClient.connect();

            // 2. Fetch tools from MCP
            const mcpTools = await mcpClient.getTools();
            
            // 3. Map MCP tools to OpenAI tools format
            const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = mcpTools.map((tool: any) => ({
                type: 'function',
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.inputSchema
                }
            }));

            const systemMessage: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
                role: 'system',
                content: `Eres StepGuard AI, un asistente inteligente para el sistema IoT de detección de caídas StepGuard.
                Utilizas un servidor MCP (Model Context Protocol) para acceder a datos en tiempo real.
                
                Tus responsabilidades:
                1. Responder preguntas sobre el estado de los dispositivos, caídas y alertas.
                2. UTILIZA las herramientas proporcionadas para obtener datos reales.
                3. Interpreta los datos JSON que te devuelven las herramientas para el usuario.
                4. Si no puedes responder, admítelo educadamente.
                5. IMPORTANTE: SIEMPRE RESPONDE EN ESPAÑOL.
                
                Contexto del usuario:
                ID: ${userContext?.id || 'Desconocido'}
                Rol: ${userContext?.role || 'Desconocido'}
                
                NOTA: Para herramientas que requieran 'adminId' o 'requesterId', usa el ID del contexto del usuario (${userContext?.id}).`
            };

            // Build messages array: System + History + Current User Query
            const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
                systemMessage,
                ...history,
                { role: 'user', content: userQuery }
            ];

            // 4. First call: Ask LLM what to do
            const response = await client.chat.completions.create({
                model: MODEL_NAME,
                messages: messages,
                tools: tools.length > 0 ? tools : undefined,
                tool_choice: tools.length > 0 ? 'auto' : undefined
            });

            const responseMessage = response.choices[0].message;

            // 5. Check if the LLM wants to call a tool
            if (responseMessage.tool_calls) {
                messages.push(responseMessage);

                // Note: We don't save the intermediate tool calls/results to long-term history 
                // to avoid blowing up the context window too fast, but we COULD if needed.
                // For now, we will only save the final turn (User -> Assistant).
                // OR better: save the whole chain if it's important. 
                // Let's safe the User Query and the Final Assistant Response. 
                // If we want "memory" of actions taken, we should save the intermediate steps too.
                // But Redis list is simple. Let's simplify: Only save User Query + Final Response.
                // Intermediate tool logic is transient context for the current answer.

                for (const toolCall of responseMessage.tool_calls) {
                    if (toolCall.type !== 'function') continue;

                    const functionName = toolCall.function.name;
                    const functionArgs = JSON.parse(toolCall.function.arguments);
                    let functionResult = '';

                    try {
                        console.log(`[AIService] Calling MCP tool: ${functionName} with args:`, functionArgs);

                        // Inject user context if needed by specific tools (manual override for now if needed, 
                        // but ideally the LLM should pass them based on the system prompt context)
                        if (functionName === 'resolve_event' && !functionArgs.adminId && userContext?.id) {
                            functionArgs.adminId = userContext.id;
                        }
                        
                        // Tools that require RBAC context
                        const rbacTools = ['get_fall_history', 'get_device_details', 'get_user_personal_info'];
                        if (rbacTools.includes(functionName)) {
                            // Always override/inject context to ensure security
                             if (userContext?.id) functionArgs.requesterId = userContext.id;
                             if (userContext?.role) functionArgs.role = userContext.role;
                        }

                        // Execute via MCP
                        const result = await mcpClient.callTool(functionName, functionArgs);
                        
                        // Format result for OpenAI
                        // MCP returns { content: [{ type: 'text', text: '...' }] }
                        if (result.content && Array.isArray(result.content)) {
                            functionResult = result.content
                                .map((c: any) => c.text)
                                .join('\n');
                        } else {
                             functionResult = JSON.stringify(result);
                        }

                    } catch (error: any) {
                        console.error(`[AIService] MCP Tool execution error (${functionName}):`, error);
                        functionResult = JSON.stringify({ error: error.message });
                    }

                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: functionResult || "No content returned"
                    });
                }

                // 6. Second call: Get final response
                const secondResponse = await client.chat.completions.create({
                    model: MODEL_NAME,
                    messages: messages
                });

                const finalContent = secondResponse.choices[0].message.content || 'Procesé los datos pero no pude generar una respuesta.';
                
                // Save to history (Async, don't block)
                if (userId) {
                    const { ChatHistoryService } = await import('./chatHistoryService');
                    // Save User Query
                    await ChatHistoryService.addToHistory(userId, { role: 'user', content: userQuery });
                    // Save Assistant Response
                    await ChatHistoryService.addToHistory(userId, { role: 'assistant', content: finalContent });
                }

                return finalContent;
            }

            // No tool call, simple response
            const finalContent = responseMessage.content || 'Lo siento, no pude entender eso.';
             
            // Save to history (Async, don't block)
            if (userId) {
                 const { ChatHistoryService } = await import('./chatHistoryService');
                 // Save User Query
                 await ChatHistoryService.addToHistory(userId, { role: 'user', content: userQuery });
                 // Save Assistant Response
                 await ChatHistoryService.addToHistory(userId, { role: 'assistant', content: finalContent });
            }

            return finalContent;

        } catch (error: any) {
            console.error('[AIService] Error processing query:', error);
            return `Lo siento, tengo problemas para conectar con el servicio de IA o el servidor MCP en este momento. Error: ${error.message}`;
        }
    }
}
