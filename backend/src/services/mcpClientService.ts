import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

export class McpClientService {
    private static instance: McpClientService;
    private client: Client | null = null;
    private transport: StdioClientTransport | null = null;
    private isConnected: boolean = false;

    private constructor() {}

    public static getInstance(): McpClientService {
        if (!McpClientService.instance) {
            McpClientService.instance = new McpClientService();
        }
        return McpClientService.instance;
    }

    /**
     * Connects to the local MCP server if not already connected.
     */
    public async connect(): Promise<void> {
        if (this.isConnected && this.client) {
            return;
        }

        try {
            console.log("[McpClientService] Connecting to MCP Server...");

            // Path to the MCP server script
            const serverScriptPath = path.resolve(__dirname, "../mcp-server.ts");
            
            // Spawn the MCP server process using node directly for better performance/reliability
            this.transport = new StdioClientTransport({
                command: process.execPath, // Node.js executable
                args: ["-r", "ts-node/register", serverScriptPath],
                env: {
                  ...process.env,
                  PATH: process.env.PATH || "", // Ensure PATH is inherited
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
     * Retrieves the list of available tools from the MCP server.
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
     * Calls a specific tool on the MCP server.
     * @param name Name of the tool to call
     * @param args Arguments for the tool
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
     * Closes the connection to the MCP server.
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
