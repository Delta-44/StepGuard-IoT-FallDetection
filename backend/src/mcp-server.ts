import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ESP32Service } from "./services/esp32Service";
import { DispositivoModel } from "./models/dispositivo";
import { EventoCaidaModel } from "./models/eventoCaida";
import pool from "./config/database";
import { ESP32Cache } from "./config/redis";
import redis from "./config/redis";
import { DiscordService } from "./services/discordService";
import * as dotenv from "dotenv";

dotenv.config();

// Redirigir console.log a console.error para evitar interferencias con el protocolo stdio de MCP
console.log = console.error;


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

    // Inicializar Discord Bot (No bloqueante)
    DiscordService.initialize().catch(err => console.error("Error inicializando Discord:", err));

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

  // 5. Obtener historial de caídas (con control de acceso)
  server.tool(
    "get_fall_history",
    {
      requesterId: z.number().describe("ID del usuario que realiza la consulta"),
      role: z.enum(["admin", "user", "family"]).describe("Rol del usuario que realiza la consulta"),
      targetUserId: z.number().optional().describe("ID del usuario objetivo (opcional, solo admin puede ver otros)"),
      targetUserName: z.string().optional().describe("Nombre del usuario objetivo (opcional)"),
      days: z.number().optional().default(30).describe("Días de historial a consultar")
    },
    async ({ requesterId, role, targetUserId, targetUserName, days = 30 }) => {
      try {
        // Resolver ID del target sies necesario
        let effectiveTargetUserId: number | undefined = targetUserId;

        if (targetUserName && !effectiveTargetUserId) {
          const user = await resolveUser(undefined, targetUserName);
          if (user) effectiveTargetUserId = user.id;
        }

        if (role !== 'admin') {
          // Usuario normal: solo puede ver su propia historia
          if (effectiveTargetUserId && effectiveTargetUserId !== requesterId) {
            return { isError: true, content: [{ type: "text", text: "Unauthorized: You can only view your own history." }] };
          }
          // Si no especifica, asumimos que quiere ver lo suyo
          if (!effectiveTargetUserId) effectiveTargetUserId = requesterId;
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        // Si es admin y no especifica target -> Ver todo (global) en el rango de fechas
        // Si especifica target -> Ver historial de ese target
        const events = await EventoCaidaModel.findByFechas(startDate, endDate, effectiveTargetUserId);

        return {
          content: [{ type: "text", text: JSON.stringify(events, null, 2) }]
        };

      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    }
  );

  // 6. Check API Status
  server.tool(

    "check_system_health",
    {},
    async () => {
      const hasKey = !!process.env.MCP_API_KEY;

      let dbStatus = "unknown";
      try {
        await pool.query('SELECT 1');
        dbStatus = "connected";
      } catch (e) { dbStatus = "error"; }

      let redisStatus = "unknown";
      if (redis.status === 'ready' || redis.status === 'connect') redisStatus = "connected";
      else redisStatus = redis.status;

      return {
        content: [{
          type: "text", text: JSON.stringify({
            mcp_server: "running",
            external_api_key_configured: hasKey,
            database: dbStatus,
            redis: redisStatus,
            mqtt: "connected (managed by service)",
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }
  );

  // 7. Enviar mensaje a Discord
  server.tool(
    "send_discord_message",
    {
      message: z.string().describe("El mensaje a enviar"),
    },
    async ({ message }) => {
      try {
        const { DiscordService } = await import("./services/discordService");

        // Usar objetivo definido en ENV

        await DiscordService.sendDirectMessage(message);

        return {
          content: [{ type: "text", text: `Mensaje enviado a Discord: "${message}"` }]
        };
      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    }
  );


  // 8. Actualizar alias del dispositivo
  server.tool(
    "update_device_alias",
    {
      macAddress: z.string().describe("MAC Address del dispositivo"),
      newAlias: z.string().describe("Nuevo nombre o alias para el dispositivo")
    },
    async ({ macAddress, newAlias }) => {
      try {
        // Nota: DispositivoModel necesita un método para esto. Si no existe, usamos update genérico o query directa.
        // Asumiremos que existe o lo simularemos con una query directa por brevedad, 
        // pero lo ideal es añadir el método al modelo.
        // Por ahora, usaremos pool directo si no hay método en el modelo.

        await pool.query('UPDATE dispositivos SET nombre = $1 WHERE mac_address = $2', [newAlias, macAddress]);

        return {
          content: [{ type: "text", text: `Dispositivo ${macAddress} renombrado a "${newAlias}"` }]
        };
      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    }
  );

  // 9. Analizar actividad del dispositivo
  server.tool(
    "analyze_device_activity",
    {
      macAddress: z.string().describe("MAC Address del dispositivo"),
      date: z.string().optional().describe("Fecha en formato YYYY-MM-DD (por defecto hoy)")
    },
    async ({ macAddress, date }) => {
      try {
        const targetDate = date ? new Date(date) : new Date();
        // Heurística simple: Contar impactos del historial en Redis para hoy

        const data = await ESP32Service.getDeviceData(macAddress);
        const history = await ESP32Cache.getDeviceHistory(macAddress); // Asumiendo que devuelve array

        // Calcular "nivel de movimiento" promedio
        let avgMagnitude = 0;
        if (history && history.length > 0) {
          const magnitudes = history.map((h: any) => h.impact_magnitude || 0);
          avgMagnitude = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
        }

        let activityLevel = "Moderada";
        if (avgMagnitude < 1.2) activityLevel = "Sedentaria";
        if (avgMagnitude > 2.5) activityLevel = "Alta";

        return {
          content: [{
            type: "text", text: JSON.stringify({
              date: targetDate.toISOString().split('T')[0],
              device: macAddress,
              current_impact_count: data?.impact_count || 0,
              average_magnitude: avgMagnitude.toFixed(2),
              activity_level: activityLevel,
              analysis: `El usuario muestra una actividad ${activityLevel} basada en ${history.length} puntos de datos recientes.`
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    }
  );

  // 10. Obtener detalles del dispositivo (RBAC)
  server.tool(
    "get_device_details",
    {
      macAddress: z.string().describe("MAC Address del dispositivo a consultar"),
      requesterId: z.number().describe("ID del usuario que solicita la información"),
      role: z.enum(["admin", "cuidador", "usuario", "familiar"]).describe("Rol del usuario solicitante")
    },
    async ({ macAddress, requesterId, role }) => {
      try {
        // 1. Obtener dispositivo y su dueño
        const device = await DispositivoModel.findByMac(macAddress);
        if (!device) {
          return { isError: true, content: [{ type: "text", text: "Dispositivo no encontrado" }] };
        }

        const owner = await DispositivoModel.getUsuarioAsignado(macAddress);

        // 2. Verificar permisos RBAC
        let isAuthorized = false;

        if (role === 'admin') {
          isAuthorized = true; // Admin ve todo
        } else if (role === 'usuario') {
          // Usuario solo ve lo suyo
          if (owner && owner.id === requesterId) {
            isAuthorized = true;
          }
        } else if (role === 'cuidador' || role === 'familiar') {
          isAuthorized = true;
        }

        if (!isAuthorized) {
          return { isError: true, content: [{ type: "text", text: "Acceso denegado: No tienes permiso para ver este dispositivo." }] };
        }

        // 3. Devolver datos enriquecidos
        const telemetry = await ESP32Service.getDeviceData(macAddress);

        return {
          content: [{
            type: "text", text: JSON.stringify({
              info: device,
              assigned_to: owner ? { id: owner.id, name: owner.nombre, email: owner.email } : null,
              telemetry: telemetry || "No real-time data",
              status: telemetry ? "Online (Redis)" : "Offline/Unknown"
            }, null, 2)
          }]
        };

      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    }
  );

  // 10.1. Obtener información personal del usuario (RBAC)
  server.tool(
    "get_user_personal_info",
    {
      targetUserId: z.number().optional().describe("ID del usuario (paciente) a consultar"),
      targetUserName: z.string().optional().describe("Nombre del usuario (paciente) a consultar"),
      requesterId: z.number().describe("ID del usuario que solicita la información"),
      role: z.enum(["admin", "cuidador", "usuario", "familiar"]).describe("Rol del usuario solicitante")
    },
    async ({ targetUserId, targetUserName, requesterId, role }) => {
      try {
        // Importar modelos dinámicamente para evitar dependencias circulares si las hubiera
        const { UsuarioModel } = await import("./models/usuario");
        const { CuidadorModel } = await import("./models/cuidador");

        // Resolver Usuario Objetivo
        const targetUser = await resolveUser(targetUserId, targetUserName);
        if (!targetUser) return { isError: true, content: [{ type: "text", text: "Usuario objetivo no encontrado." }] };
        const effectiveTargetId = targetUser.id;

        // 1. Verificar Permisos
        let isAuthorized = false;

        if (role === 'admin') {
          isAuthorized = true;
        } else if (role === 'usuario') {
          if (effectiveTargetId === requesterId) {
            isAuthorized = true;
          }
        } else if (role === 'cuidador' || role === 'familiar') {
          // Verificar si el cuidador tiene asignado al paciente
          const assignedUsers = await CuidadorModel.getUsuariosAsignados(requesterId);
          const isAssigned = assignedUsers.some(u => u.id === effectiveTargetId);

          if (isAssigned) {
            isAuthorized = true;
          }
        }

        if (!isAuthorized) {
          return { isError: true, content: [{ type: "text", text: "Acceso denegado: No tienes permiso para ver la información personal de este usuario." }] };
        }

        // 2. Obtener Datos
        const user = await UsuarioModel.findByIdWithDevice(effectiveTargetId);
        if (!user) {
          return { isError: true, content: [{ type: "text", text: "Usuario no encontrado en BDD" }] };
        }

        // 3. Obtener Historial de Caídas (Resumen)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1); // Último mes

        const events = await EventoCaidaModel.findByFechas(startDate, endDate, effectiveTargetId);

        return {
          content: [{
            type: "text", text: JSON.stringify({
              personal_info: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                direccion: user.direccion,
                telefono: user.telefono,
                fecha_nacimiento: user.fecha_nacimiento,
                dispositivo: {
                  mac: user.dispositivo_mac,
                  nombre: user.dispositivo_nombre,
                  estado: user.dispositivo_estado
                }
              },
              recent_activity: {
                total_alerts_last_30_days: events.length,
                last_alert: events.length > 0 ? events[0] : null
              }
            }, null, 2)
          }]
        };

      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    }
  );

  // Iniciar servidor
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // 11. Simular evento de riesgo (Dev Tool)
  server.tool(
    "simulate_risk_event",
    {
      macAddress: z.string().describe("MAC Address del dispositivo"),
      type: z.enum(["FALL", "SOS"]).describe("Tipo de evento a simular")
    },
    async ({ macAddress, type }) => {
      try {
        const mockPayload = {
          macAddress,
          impact_magnitude: type === 'FALL' ? 4.5 : 0,
          isFallDetected: type === 'FALL',
          isButtonPressed: type === 'SOS',
          impact_count: 1,
          battery_voltage: 3.8
        };

        await ESP32Service.processTelemetry(mockPayload);

        return {
          content: [{ type: "text", text: `Simulación enviada: Evento ${type} para ${macAddress}. Revisa las alertas.` }]
        };
      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    }
  );

  // 12. Asignar cuidador a paciente
  server.tool(
    "assign_caregiver",
    {
      caregiverEmail: z.string().describe("Email del cuidador"),
      patientEmail: z.string().describe("Email del paciente (usuario)")
    },
    async ({ caregiverEmail, patientEmail }) => {
      try {
        // Import dinámico de modelos si no están arriba
        const { CuidadorModel } = await import("./models/cuidador");
        const { UsuarioModel } = await import("./models/usuario");

        const caregiver = await CuidadorModel.findByEmail(caregiverEmail);
        if (!caregiver) return { isError: true, content: [{ type: "text", text: "Cuidador no encontrado" }] };

        const patient = await UsuarioModel.findByEmail(patientEmail);
        if (!patient) return { isError: true, content: [{ type: "text", text: "Paciente no encontrado" }] };

        const success = await CuidadorModel.asignarUsuario(caregiver.id, patient.id);

        if (success) {
          return { content: [{ type: "text", text: `Asignación exitosa: ${caregiver.nombre} ahora cuida a ${patient.nombre}.` }] };
        } else {
          return { isError: true, content: [{ type: "text", text: "Error al asignar. Verifica si ya existe la relación." }] };
        }
      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    }
  );

  // 13. Generar reporte semanal
  server.tool(
    "generate_weekly_report",
    {
      userId: z.number().optional().describe("ID del usuario (paciente)"),
      userName: z.string().optional().describe("Nombre del usuario (paciente)"),
    },
    async ({ userId, userName }) => {
      try {
        const { UsuarioModel } = await import("./models/usuario");

        // Resolver Usuario
        const targetUser = await resolveUser(userId, userName);
        if (!targetUser) return { isError: true, content: [{ type: "text", text: "Usuario no encontrado." }] };
        const effectiveUserId = targetUser.id;

        // 1. Get User Info & Device
        const user = await UsuarioModel.findByIdWithDevice(effectiveUserId);
        if (!user) return { isError: true, content: [{ type: "text", text: "Usuario no encontrado (DB)." }] };
        if (!user.dispositivo_mac) return { isError: true, content: [{ type: "text", text: "El usuario no tiene dispositivo asignado." }] };

        // 2. Get Events (Last 7 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);

        const events = await EventoCaidaModel.findByFechas(startDate, endDate, effectiveUserId);

        const fallCount = events.filter(e => e.is_fall_detected).length;
        const sosCount = events.filter(e => e.is_button_pressed).length;

        // 3. Get Device Status (Snapshot)
        const telemetry = await ESP32Cache.getDeviceData(user.dispositivo_mac);
        const status = await ESP32Cache.getDeviceStatus(user.dispositivo_mac);

        const report = `
# Reporte Semanal: ${user.nombre}
**Fecha:** ${endDate.toISOString().split('T')[0]}
**Dispositivo:** ${user.dispositivo_mac} (${user.dispositivo_nombre})

## Resumen de Alertas (7 días)
- **Caídas Detectadas:** ${fallCount}
- **Botones SOS:** ${sosCount}
- **Total Alertas:** ${events.length}

## Estado Actual
- **Conectado:** ${status ? 'SÍ' : 'NO'}
- **Última Actividad:** ${telemetry ? new Date(telemetry.timestamp).toLocaleString() : 'N/A'}
- **Batería (est.):** ${telemetry?.battery_voltage || 'N/A'}V

${events.length > 0 ? '## Detalle de Eventos Recientes\n' + events.slice(0, 3).map(e => `- ${new Date(e.fecha_hora).toLocaleString()}: ${e.notas || 'Sin notas'} (${e.severidad})`).join('\n') : 'Sin eventos recientes de riesgo.'}
`;

        return {
          content: [{ type: "text", text: report }]
        };

      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    }
  );

  // 14. Activar/Desactivar Modo Mantenimiento
  server.tool(
    "toggle_maintenance",
    {
      macAddress: z.string().describe("MAC Address del dispositivo"),
      durationMinutes: z.number().optional().default(60).describe("Duración en minutos (solo para activar)"),
      enable: z.boolean().describe("True para activar, False para desactivar")
    },
    async ({ macAddress, durationMinutes, enable }) => {
      try {
        if (enable) {
          await ESP32Cache.setMaintenanceMode(macAddress, durationMinutes);
          return {
            content: [{ type: "text", text: `Modo Mantenimiento ACTIVADO para ${macAddress} por ${durationMinutes} minutos. Las alertas serán silenciadas.` }]
          };
        } else {
          await redis.del(`maintenance:${macAddress}`);
          return {
            content: [{ type: "text", text: `Modo Mantenimiento DESACTIVADO para ${macAddress}.` }]
          };
        }
      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    }
  );

  // Helper para resolver usuario por ID o Nombre
  const resolveUser = async (userId?: number, userName?: string): Promise<{ id: number, name: string } | null> => {
    const { UsuarioModel } = await import("./models/usuario");

    if (userId) {
      const user = await UsuarioModel.findById(userId);
      return user ? { id: user.id, name: user.nombre } : null;
    }

    if (userName) {
      const users = await UsuarioModel.searchByName(userName);
      if (users.length === 0) throw new Error(`No se encontró ningún usuario con el nombre "${userName}".`);
      if (users.length > 1) {
        const names = users.map(u => u.nombre).join(", ");
        throw new Error(`Búsqueda ambigua: "${userName}" coincide con varios usuarios (${names}). Por favor, sé más específico.`);
      }
      return { id: users[0].id, name: users[0].nombre };
    }

    throw new Error("Debes proporcionar userId o userName.");
  };

  // 15. Analizar tendencias y patrones (AI Insights)
  server.tool(
    "analyze_trends",
    {
      userId: z.number().optional().describe("ID del usuario a analizar"),
      userName: z.string().optional().describe("Nombre (o parte) del usuario a analizar"),
      days: z.number().optional().default(30).describe("Días de historial a analizar (default 30)")
    },
    async ({ userId, userName, days }) => {
      try {
        const user = await resolveUser(userId, userName);
        if (!user) return { isError: true, content: [{ type: "text", text: "Usuario no encontrado." }] };

        const { AnalysisService } = await import("./services/analysisService");
        const result = await AnalysisService.analyzeUserTrends(user.id, days);

        return {
          content: [{
            type: "text", text: JSON.stringify({
              user: user.name,
              ...result
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
    }
  );

  console.error("StepGuard MCP Server running on stdio");
};

main().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  process.exit(1);
});
