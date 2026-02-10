import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ESP32Service } from "./services/esp32Service";
import { DispositivoModel } from "./models/dispositivo";
import { EventoCaidaModel } from "./models/eventoCaida";
import pool from "./config/database";
import redis from "./config/redis";
import dotenv from "dotenv";

dotenv.config();

const main = async () => {
  // Inicializar conexiones a base de datos y Redis
  try {
    console.error("Verificando conexiones a DB y Redis...");
    
    // Verificar Redis
    if (redis.status === 'ready' || redis.status === 'connect') {
        console.error("Redis conectado.");
    } else {
        await new Promise<void>((resolve) => {
            redis.once('ready', () => {
                console.error("Redis conectado (evento ready).");
                resolve();
            });
        });
    }

    // Verificar Postgres
    await pool.query('SELECT NOW()');
    console.error("PostgreSQL conectado.");

  } catch (error) {
    console.error("Error inicializando backend:", error);
    process.exit(1);
  }

  const server = new McpServer({
    name: "StepGuard IoT",
    version: "1.0.0"
  });

  // --- TOOLS ---

  // 1. Obtener telemetría en tiempo real de un dispositivo
  server.tool(
    "get_device_telemetry",
    { macAddress: z.string().describe("MAC Address del dispositivo ESP32") },
    async ({ macAddress }) => {
      try {
        const data = await ESP32Service.getDeviceData(macAddress);
        if (!data || Object.keys(data).length === 0) {
          return {
            content: [{ type: "text", text: `No telemetry found in Redis for device ${macAddress}` }]
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
        };
      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    }
  );

  // 2. Listar todos los dispositivos registrados
  server.tool(
    "list_devices",
    {},
    async () => {
      try {
        const devices = await DispositivoModel.findAllWithUser();
        return {
          content: [{ type: "text", text: JSON.stringify(devices, null, 2) }]
        };
      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    }
  );

  // 3. Listar eventos de caída pendientes
  server.tool(
    "list_pending_events",
    {},
    async () => {
      try {
        const events = await EventoCaidaModel.findPendientes();
        return {
          content: [{ type: "text", text: JSON.stringify(events, null, 2) }]
        };
      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    }
  );

  // 4. Resolver un evento de caída
  server.tool(
    "resolve_event",
    {
      eventId: z.number().describe("ID del evento de caída"),
      adminId: z.number().describe("ID del administrador/cuidador que resuelve"),
      status: z.enum(["atendida", "falsa_alarma"]).describe("Nuevo estado del evento"),
      notes: z.string().optional().describe("Notas sobre la resolución"),
      severity: z.enum(["low", "medium", "high", "critical"]).optional().describe("Ajustar severidad si es necesario")
    },
    async ({ eventId, adminId, status, notes, severity }) => {
      try {
        const result = await EventoCaidaModel.resolveWithDetails(
          eventId,
          adminId,
          status,
          notes,
          severity
        );
        
        if (!result) {
          return { isError: true, content: [{ type: "text", text: `Event ${eventId} not found or could not be updated` }] };
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
        };
      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    }
  );

  // 5. Check API Status
  server.tool(
    "check_api_status",
    {},
    async () => {
        const hasKey = !!process.env.MCP_API_KEY;
        return {
            content: [{ type: "text", text: `MCP Server running. External API Key configured: ${hasKey}` }]
        };
    }
  );

  // Iniciar servidor
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("StepGuard MCP Server running on stdio");
};

main().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  process.exit(1);
});
