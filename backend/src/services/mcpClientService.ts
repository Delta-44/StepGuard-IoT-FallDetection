import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

export class McpClientService {
    private static instance: McpClientService;
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;
    private isConnected: boolean = false;

    private constructor() { }

    public static getInstance(): McpClientService {
        if (!McpClientService.instance) {
            McpClientService.instance = new McpClientService();
        }
        return McpClientService.instance;
    }

    /**
     * Conecta al servidor MCP local si no está conectado.
     */
    public async connect(): Promise<void> {
        if (this.isConnected && this.client) {
            return;
        }

        try {
            console.log("[McpClientService] Connecting to MCP Server...");

            // Detectar entorno: Si estamos en producción (ejecutando .js o NODE_ENV=production)
            const isProduction = process.env.NODE_ENV === 'production' || __filename.endsWith('.js');

            // Ajustar ruta y argumentos según el entorno
            const serverScriptPath = isProduction
                ? path.resolve(__dirname, "../mcp-server.js") // dist/mcp-server.js
                : path.resolve(__dirname, "../mcp-server.ts"); // src/mcp-server.ts

            const args = isProduction
                ? [serverScriptPath]
                : ["-r", "ts-node/register", serverScriptPath];

            console.log(`[McpClientService] Environment detected: ${isProduction ? 'Production' : 'Development'}`);
            console.log(`[McpClientService] Server script path: ${serverScriptPath}`);

            // Iniciar el proceso del servidor MCP usando node directamente para mejor rendimiento/confiabilidad
            this.transport = new StdioClientTransport({
                command: process.execPath, // Ejecutable Node.js
                args: args,
                env: {
                    ...process.env,
                    PATH: process.env.PATH || "", // Asegurar que PATH se herede
                }
            });

            this.client = new Client(
                {
                    name: "StepGuard-Backend-Client",
                    version: "1.0.0",
                },
                {
                    capabilities: {
                        sampling: {},
                    },
                }
            );

            await this.client.connect(this.transport);
            this.isConnected = true;
            console.log("[McpClientService] Connected to MCP Server successfully.");

            this.transport.onclose = () => {
                console.warn("[McpClientService] Connection to MCP Server closed.");
                this.isConnected = false;
                this.client = null;
                this.transport = null;
            };

            this.transport.onerror = (error) => {
                console.error("[McpClientService] Transport error:", error);
            };

        } catch (error) {
            console.error("[McpClientService] Failed to connect to MCP Server:", error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Recupera la lista de herramientas disponibles del servidor MCP.
     */
    public async getTools(): Promise<any[]> { // Returns ListToolsResult
        await this.connect();
        if (!this.client) {
            throw new Error("MCP Client is not initialized.");
        }

        try {
            const result = await this.client.listTools();
            return result.tools;
        } catch (error) {
            console.error("[McpClientService] Error listing tools:", error);
            throw error;
        }
    }

    /**
     * Llama a una herramienta específica en el servidor MCP.
     * @param name Nombre de la herramienta a llamar
     * @param args Argumentos para la herramienta
     */
    public async callTool(name: string, args: any): Promise<any> {
        await this.connect();
        if (!this.client) {
            throw new Error("MCP Client is not initialized.");
        }

        try {
            const result = await this.client.callTool({
                name: name,
                arguments: args,
            });
            return result;
        } catch (error) {
            console.error(`[McpClientService] Error calling tool '${name}':`, error);
            throw error;
        }
    }

    /**
     * Cierra la conexión al servidor MCP.
     */
    public async close(): Promise<void> {
        if (this.client) {
            await this.client.close();
        }
        this.isConnected = false;
        this.client = null;
        this.transport = null;
    }
}
