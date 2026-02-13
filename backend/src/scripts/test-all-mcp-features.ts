import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const API_URL = 'http://localhost:3000/api/chat';

// Colors for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

// Configuration
const MAC = 'AA:BB:CC:DD:EE:01'; 
const USER_ID = 1; // Juan Perez
const CAREGIVER_EMAIL = 'ana.lopez@email.com'; // Admin/Caregiver
const USER_EMAIL = 'juan.perez@email.com';

// Generate Tokens
const adminToken = jwt.sign({ id: 999, role: 'admin', email: 'admin@test.com' }, JWT_SECRET, { expiresIn: '1h' });
const userToken = jwt.sign({ id: USER_ID, role: 'usuario', email: USER_EMAIL }, JWT_SECRET, { expiresIn: '1h' });

async function runTest(name: string, query: string, token: string = adminToken, logResponse: boolean = true) { // Default logResponse to true
    console.log(`\n${YELLOW}[TEST] ${name}${RESET}`);
    console.log(`User asks: "${query}"`);
    
    try {
        const start = Date.now();
        const res = await axios.post(
            API_URL,
            { message: query },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const duration = Date.now() - start;
        
        if (res.status === 200 && res.data.reply) {
            console.log(`${GREEN}PASS${RESET} (${duration}ms)`);
            console.log(`System replies:\n${RESET}${res.data.reply}\n`);
            return res.data.reply;
        } else {
            console.log(`${RED}FAIL${RESET} (Invalid response structure)`);
            console.log(res.data);
            return null;
        }
    } catch (error: any) {
        console.log(`${RED}FAIL${RESET} (${error.message})`);
        if (error.response) console.log(error.response.data);
        return null;
    }
}

async function main() {
    console.log("=== STARTING COMPREHENSIVE MCP FEATURE TEST ===\n");

    // 1. System Health
    await runTest("check_system_health", "¿Cómo está la salud del sistema?");

    // 2. Device Listing
    await runTest("list_devices", "Lista todos los dispositivos");

    // 3. Telemetry
    await runTest("get_device_telemetry", `Dame la telemetría del dispositivo ${MAC}`, adminToken, true);

    // 4. Update Alias
    await runTest("update_device_alias", `Cambia el nombre del dispositivo ${MAC} a 'Test Device ${Date.now()}'`);

    // 5. Analyze Activity
    await runTest("analyze_device_activity", `Analiza la actividad del dispositivo ${MAC} de hoy`, adminToken, true);

    // 6. Device Details (RBAC)
    // Admin request -> Should succeed
    console.log("\n--- RBAC Check ---");
    await runTest("get_device_details (Admin)", `Dame detalles del dispositivo ${MAC}`, adminToken);
    
    // User request (for unknown device) -> Should fail/deny
    const UNKNOWN_MAC = 'FF:FF:FF:FF:FF:FF';
    const reply = await runTest("get_device_details (User/Unauthorized)", `Dame detalles del dispositivo ${UNKNOWN_MAC}`, userToken);
    if (reply && (reply.includes("No tengo permiso") || reply.includes("no encontrado"))) {
         console.log(`${GREEN}RBAC PASS: User correctly denied/handled.${RESET}`);
    } else {
         console.log(`${RED}RBAC WARNING: Check response content above.${RESET}`);
    }

    // 7. Events & History
    await runTest("list_pending_events", "Lista los eventos pendientes");
    await runTest("get_fall_history (Admin)", `Dame el historial de caídas del usuario ${USER_ID}`);
    await runTest("get_fall_history (User - Self)", `Dame mi historial de caídas`, userToken);

    // 8. Advanced Features - Maintenance & Simulation
    console.log("\n--- Advanced Logic Check ---");
    
    // Enable Maintenance
    await runTest("toggle_maintenance (Enable)", `Activa mantenimiento en ${MAC} por 5 minutos`);
    
    // Simulate Risk (Should be ignored)
    const simRep1 = await runTest("simulate_risk_event (Suppressed)", `Simula una caída en ${MAC}`);
    if (simRep1 && simRep1.includes("Simulación enviada")) {
        console.log(`${YELLOW}Note: Simulation sending is a command, suppression happens in backend. Check Server Logs for '[Maintenance Mode] Ignoring alert'.${RESET}`);
    }

    // Disable Maintenance
    await runTest("toggle_maintenance (Disable)", `Desactiva mantenimiento en ${MAC}`);

    // Simulate Risk (Should trigger)
    await runTest("simulate_risk_event (Active)", `Simula una caída en ${MAC}`);

    // 9. Reporting & Assignment
    await runTest("generate_weekly_report", `Genera el reporte semanal para el usuario ${USER_ID}`);
    await runTest("assign_caregiver", `Asigna a ${CAREGIVER_EMAIL} como cuidador de ${USER_EMAIL}`);

    // 10. Discord
    await runTest("send_discord_message", `Envíale un mensaje a Discord: 'Prueba de mensaje genérico completada.'`);

    console.log("\n=== TEST COMPLETE ===");
}

main();
