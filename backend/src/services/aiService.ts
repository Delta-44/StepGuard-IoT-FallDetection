import OpenAI from 'openai';
import { McpClientService } from './mcpClientService';
import dotenv from 'dotenv';

dotenv.config();

// Configuración para OpenRouter
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
     * Procesa una consulta de usuario utilizando OpenRouter LLM y herramientas internas vía MCP.
     * @param userQuery La pregunta o comando del usuario.
     * @returns La respuesta en lenguaje natural de la IA.
     */
    static async processQuery(userQuery: string, userContext?: { id: number, role: string }): Promise<string> {
        try {
            // 0. Inicializar Historial (si el usuario está autenticado)
            const userId = userContext?.id;
            let history: any[] = [];

            if (userId) {
                const { ChatHistoryService } = await import('./chatHistoryService');
                history = await ChatHistoryService.getHistory(userId);
            }

            // 1. Inicializar Cliente MCP
            const mcpClient = McpClientService.getInstance();
            await mcpClient.connect();

            // 2. Obtener herramientas de MCP
            const mcpTools = await mcpClient.getTools();

            // 3. Mapear herramientas MCP al formato de herramientas de OpenAI
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
                2. SIEMPRE que la pregunta requiera datos en tiempo real, DEBES utilizar las herramientas proporcionadas.
                3. NO inventes datos bajo ninguna circunstancia.
                4. Interpreta los datos JSON devueltos por las herramientas y explícalos de forma clara al usuario.
                5. Si una herramienta devuelve un error o datos vacíos, informa claramente al usuario.
                6. Si no puedes responder porque no existe una herramienta adecuada, admítelo educadamente.
                7. IMPORTANTE: SIEMPRE RESPONDE EN ESPAÑOL.
                8. Cuando te pidan hacer algo, ejecuta la acción directamente sin pedir permiso, siempre que exista la herramienta necesaria.
                
                Contexto del usuario:
                ID: ${userContext?.id || 'Desconocido'}
                Rol: ${userContext?.role || 'Desconocido'}
                
                NOTA: Para herramientas que requieran 'adminId' o 'requesterId', usa el ID del contexto del usuario (${userContext?.id}).
                `
            };


            // Construir arreglo de mensajes: Sistema + Historial + Consulta Actual del Usuario
            const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
                systemMessage,
                ...history,
                { role: 'user', content: userQuery }
            ];

            // 4. Bucle para Ejecución de Herramientas Multi-Turno
            let loopCount = 0;
            const MAX_LOOPS = 5;

            while (loopCount < MAX_LOOPS) {
                // Llamar al LLM
                const response = await client.chat.completions.create({
                    model: MODEL_NAME,
                    messages: messages,
                    tools: tools.length > 0 ? tools : undefined,
                    tool_choice: tools.length > 0 ? 'auto' : undefined
                });

                const responseMessage = response.choices[0].message;
                messages.push(responseMessage); // Agregar respuesta del asistente al historial

                // Verificar si el LLM quiere llamar a una herramienta
                if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                    // console.log(`[AIService] LLM requested ${responseMessage.tool_calls.length} tool calls. Loop: ${loopCount + 1}`);

                    for (const toolCall of responseMessage.tool_calls) {
                        if (toolCall.type !== 'function') continue;

                        const functionName = toolCall.function.name;
                        let functionArgs: any = {};
                        try {
                            functionArgs = JSON.parse(toolCall.function.arguments);
                        } catch (e) {
                            console.error(`[AIService] Failed to parse args for ${functionName}:`, toolCall.function.arguments);
                            functionArgs = {};
                        }

                        let functionResult = '';

                        try {
                            console.log(`[AIService] Calling MCP tool: ${functionName} with args:`, functionArgs);

                            // Inyectar contexto de usuario si es necesario
                            if (functionName === 'resolve_event' && !functionArgs.adminId && userContext?.id) {
                                functionArgs.adminId = userContext.id;
                            }

                            // Herramientas que requieren contexto RBAC
                            const rbacTools = ['get_fall_history', 'get_device_details', 'get_user_personal_info'];
                            if (rbacTools.includes(functionName)) {
                                if (userContext?.id) functionArgs.requesterId = userContext.id;
                                if (userContext?.role) functionArgs.role = userContext.role;
                            }

                            // Ejecutar vía MCP
                            const result = await mcpClient.callTool(functionName, functionArgs);

                            // Formatear resultado
                            if (result.content && Array.isArray(result.content)) {
                                functionResult = result.content.map((c: any) => c.text).join('\n');
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

                    // Incrementar contador de bucle y continuar a la siguiente iteración (enviando salidas de herramientas al LLM)
                    loopCount++;
                } else {
                    // No hay más llamadas a herramientas, tenemos la respuesta final
                    const finalContent = responseMessage.content || 'Procesé los datos pero no pude generar una respuesta final.';

                    // Guardar en historial (mientras tanto)
                    if (userId) {
                        const { ChatHistoryService } = await import('./chatHistoryService');
                        await ChatHistoryService.addToHistory(userId, { role: 'user', content: userQuery });
                        await ChatHistoryService.addToHistory(userId, { role: 'assistant', content: finalContent });
                    }

                    return finalContent;
                }
            }

            return "Lo siento, la operación es demasiado compleja y alcancé el límite de intentos.";

        } catch (error: any) {
            console.error('[AIService] Error processing query:', error);
            return `Lo siento, tengo problemas para conectar con el servicio de IA o el servidor MCP en este momento. Error: ${error.message}`;
        }
    }
}
