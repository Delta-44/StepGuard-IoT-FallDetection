import OpenAI from 'openai';
import { ESP32Service } from './esp32Service';
import { DispositivoModel } from '../models/dispositivo';
import { EventoCaidaModel } from '../models/eventoCaida';
import dotenv from 'dotenv';

dotenv.config();

// Configuration for OpenRouter
const OPENROUTER_API_KEY = process.env.MCP_API_KEY || ''; // Reusing the same key variable
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL_NAME = 'google/gemini-2.0-flash-001';

if (!OPENROUTER_API_KEY) {
    console.warn('WARNING: MCP_API_KEY is not set. AI Service will not function correctly.');
}

const client = new OpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": "https://stepguard-iot.com", // Optional: required by some OpenRouter models
        "X-Title": "StepGuard IoT", // Optional
    }
});

// Define tools available to the LLM
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'get_device_telemetry',
            description: 'Get real-time telemetry data (accelerometer, status) for a specific ESP32 device.',
            parameters: {
                type: 'object',
                properties: {
                    macAddress: {
                        type: 'string',
                        description: 'The MAC address of the device (e.g., "FF:FF:FF:FF:FF:FF").'
                    }
                },
                required: ['macAddress']
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'list_devices',
            description: 'List all registered devices and their assigned users.',
            parameters: {
                type: 'object',
                properties: {},
            }
        }
    },
    {
        type: 'function',
        function: {
            name: 'list_pending_events',
            description: 'List all pending fall events or SOS alerts that have not been resolved.',
            parameters: {
                type: 'object',
                properties: {},
            }
        }
    }
];

export class AIService {

    /**
     * Process a user query using OpenRouter LLM and internal tools.
     * @param userQuery The question or command from the user.
     * @returns The natural language response from the AI.
     */
    static async processQuery(userQuery: string): Promise<string> {
        try {
            const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
                {
                    role: 'system',
                    content: `You are StepGuard AI, an intelligent assistant for an IoT Fall Detection system.
                    You have access to real-time data from ESP32 devices and database records.
                    
                    Your responsibilities:
                    1. Answer questions about device status, falls, and alerts concisely.
                    2. If you need data, use the provided tools.
                    3. If a tool returns data, interpret it for the user.
                    4. If you cannot answer, admit it politedly.
                    
                    Current context:
                    - You are speaking to a dashboard user (likely a caregiver or admin).
                    - Be helpful and professional.`
                },
                { role: 'user', content: userQuery }
            ];

            // First call: Ask LLM what to do (it might call a tool)
            const response = await client.chat.completions.create({
                model: MODEL_NAME,
                messages: messages,
                tools: tools,
                tool_choice: 'auto'
            });

            const responseMessage = response.choices[0].message;

            // Check if the LLM wants to call a tool
            if (responseMessage.tool_calls) {
                // Add the LLM's request to the conversation history
                messages.push(responseMessage);

                // Execute each tool call
                for (const toolCall of responseMessage.tool_calls) {
                    // Start of workaround for type issue with OpenRouter/OpenAI compatibility
                    if (toolCall.type !== 'function') continue;
                    
                    const functionName = toolCall.function.name;
                    const functionArgs = JSON.parse(toolCall.function.arguments);
                    
                    let functionResult = '';

                    try {
                        console.log(`[AIService] Calling tool: ${functionName} with args:`, functionArgs);
                        
                        if (functionName === 'get_device_telemetry') {
                            const data = await ESP32Service.getDeviceData(functionArgs.macAddress);
                            functionResult = JSON.stringify(data || { error: 'Device not found or offline' });
                        } else if (functionName === 'list_devices') {
                            const devices = await DispositivoModel.findAllWithUser();
                            functionResult = JSON.stringify(devices);
                        } else if (functionName === 'list_pending_events') {
                            const events = await EventoCaidaModel.findPendientes();
                            functionResult = JSON.stringify(events);
                        } else {
                            functionResult = JSON.stringify({ error: 'Tool not found' });
                        }
                    } catch (error: any) {
                        console.error(`[AIService] Tool execution error (${functionName}):`, error);
                        functionResult = JSON.stringify({ error: error.message });
                    }

                    // Feed the tool result back to the LLM
                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: functionResult
                    });
                }

                // Second call: Get the final natural language response
                const secondResponse = await client.chat.completions.create({
                    model: MODEL_NAME,
                    messages: messages
                });

                return secondResponse.choices[0].message.content || 'I processed the data but could not generate a response.';
            }

            // If no tool was called, just return the text
            return responseMessage.content || 'I am sorry, I could not understand that.';

        } catch (error: any) {
            console.error('[AIService] Error processing query:', error);
            if (error.response) {
                console.error('[AIService] OpenRouter Response Data:', error.response.data);
                console.error('[AIService] OpenRouter Response Status:', error.response.status);
            }
            return `Sorry, I am having trouble connecting to the AI service right now. Error: ${error.message}`;
        }
    }
}
