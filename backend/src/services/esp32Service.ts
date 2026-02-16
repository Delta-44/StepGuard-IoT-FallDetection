import { ESP32Cache } from '../config/redis';
import { DispositivoModel } from '../models/dispositivo';
import { EventoCaidaModel } from '../models/eventoCaida';
import { AlertService } from './alertService';

export class ESP32Service {
    /**
     * Procesa datos de telemetría entrantes desde HTTP o MQTT
     * @param data - La carga útil de datos sin procesar
     * @returns Objeto de datos procesados o lanza un error
     */
    static async processTelemetry(data: any) {
        const { macAddress, ...telemetry } = data;

        if (!macAddress) {
            throw new Error('Mac Address is required');
        }

        // 1. Guardar estado actual en Redis
        await ESP32Cache.setDeviceData(macAddress, telemetry);

        // 2. Agregar al historial en Redis
        await ESP32Cache.addDeviceHistory(macAddress, telemetry);

        // 3. Las actualizaciones de estado se manejan por separado en updateDeviceStatus

        // 4. Persistir en PostgreSQL
        try {
            // Actualizar dispositivo existente
            const updatedDevice = await DispositivoModel.actualizarDatosESP32(
                macAddress,
                telemetry.impact_count || 0,
                telemetry.impact_magnitude
            );

            if (!updatedDevice) {
                console.log(`Nuevo dispositivo detectado: ${macAddress}. Auto-creando...`);
                // Auto-crear dispositivo si no existe
                const defaultName = `Dispositivo ESP32 ${macAddress}`;
                await DispositivoModel.create(macAddress, defaultName);

                // Actualizar con los datos recientes
                await DispositivoModel.actualizarDatosESP32(
                    macAddress,
                    telemetry.impact_count || 0,
                    telemetry.impact_magnitude
                );
            }
        } catch (dbError) {
            console.error('Error persistiendo en PostgreSQL:', dbError);
            // Error no bloqueante
        }

        // 5. Verificar detección de caídas y presión de botón
        if (telemetry.isFallDetected || telemetry.isButtonPressed) {

            // Verificar MODO MANTENIMIENTO
            const isMaintenance = await ESP32Cache.getMaintenanceMode(macAddress);
            if (isMaintenance) {
                console.log(`[Maintenance Mode] Ignoring alert from ${macAddress}`);
                return { macAddress, ...telemetry, note: "Maintenance Mode Active - Alerts Suppressed" };
            }

            // Obtener usuario asociado con este dispositivo
            const usuario = await DispositivoModel.getUsuarioAsignado(macAddress);
            const usuarioId = usuario ? usuario.id : undefined;

            if (telemetry.isFallDetected) {
                await ESP32Cache.setFallAlert(macAddress, telemetry);
                console.log(`FALL DETECTED for device ${macAddress} (Magnitude: ${telemetry.impact_magnitude})`);

                // Persist fall event con datos reales del ESP32
                const impactMagnitudes = telemetry.impact_magnitude ? [telemetry.impact_magnitude] : [];
                const fallEvent = await EventoCaidaModel.create(
                    macAddress,
                    usuarioId,
                    false, // is_button_pressed
                    true, // is_fall_detected
                    impactMagnitudes, // impact_magnitudes array
                    telemetry.impact_count || 1, // impact_count
                    'high', // severidad
                    'Caída detectada automáticamente'
                );
                console.log('Evento de caída guardado en Postgres');

                // Broadcast to frontend
                AlertService.broadcast({
                    type: 'FALL_DETECTED',
                    data: fallEvent
                });
            }

            if (telemetry.isButtonPressed) {
                console.log(`SOS BUTTON PRESSED for device ${macAddress}`);

                // Persist SOS event con datos reales del ESP32
                const impactMagnitudes = telemetry.impact_magnitude ? [telemetry.impact_magnitude] : [];
                const sosEvent = await EventoCaidaModel.create(
                    macAddress,
                    usuarioId,
                    true, // is_button_pressed
                    telemetry.isFallDetected || false, // is_fall_detected
                    impactMagnitudes, // impact_magnitudes array
                    telemetry.impact_count || 0, // impact_count
                    'critical', // severidad
                    'Botón SOS presionado'
                );
                console.log('Evento SOS guardado en Postgres');

                // Broadcast to frontend
                AlertService.broadcast({
                    type: 'sos_button',
                    data: sosEvent
                });
            }
        }

        return { macAddress, ...telemetry };
    }

    /**
     * Obtener datos del dispositivo por dirección MAC
     */
    static async getDeviceData(macAddress: string) {
        return await ESP32Cache.getDeviceData(macAddress);
    }

    /**
     * Actualizar estado del dispositivo (online/offline)
     */
    static async updateDeviceStatus(macAddress: string, status: string | boolean) {
        // Normalizar estado a booleano si es cadena 'online'/'offline' o similar
        let isOnline = false;
        if (typeof status === 'string') {
            isOnline = status.toLowerCase() === 'online';
        } else {
            isOnline = !!status;
        }

        // Verificar estado anterior para transiciones
        const previousStatus = await ESP32Cache.getDeviceStatus(macAddress);
        // console.log(`[DEBUG] Transition Check: Previous=${previousStatus}, New=${isOnline}`);

        await ESP32Cache.setDeviceStatus(macAddress, isOnline);
        // console.log(`device ${macAddress} is ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

        // Sincronizar con PostgreSQL al cambiar de estado
        try {
            await DispositivoModel.updateEstado(macAddress, isOnline);
            // console.log(`Postgres updated: device ${macAddress} transitioned to ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
        } catch (error) {
            console.error(`Error syncing status to Postgres for ${macAddress}:`, error);
        }
    }


    /**
     * Registrar un latido (heartbeat) de un dispositivo.
     * Actualiza el puntaje ZSET y asegura que el estado sea online.
     */
    static async registerHeartbeat(macAddress: string) {
        await ESP32Cache.updateHeartbeat(macAddress);

        // Asegurar que esté marcado como online (la lógica interna maneja la transición si es necesaria)
        // Optimización: Podríamos verificar si ya está online para ahorrar llamadas,
        // pero updateDeviceStatus maneja las verificaciones de transición de manera eficiente.
        await this.updateDeviceStatus(macAddress, 'online');
    }

    /**
     * Iniciar el monitor en segundo plano para verificar latidos expirados.
     * Tiempo de espera: 17 segundos.
     */
    static startHeartbeatMonitor() {
        console.log('Iniciando Monitor de Latidos (verificación de tiempo de espera de 17s cada 5s)...');

        setInterval(async () => {
            // console.log('[DEBUG] Tic del Monitor de Latidos'); // Verbosidad
            try {
                const threshold = Date.now() - 2500; // hace 1 segundo
                const expiredDevices = await ESP32Cache.getExpiredHeartbeats(threshold);
                // console.log(`[DEBUG] Check expired < ${threshold}. Found: ${expiredDevices.length}`);

                if (expiredDevices.length > 0) {
                    console.log(`Encontrados ${expiredDevices.length} dispositivos expirados (Sin latido > 3s). Marcando offline...`);

                    for (const mac of expiredDevices) {
                        try {
                            console.log(`Dispositivo ${mac} agotó tiempo de espera. Marcando OFFLINE.`);
                            await this.updateDeviceStatus(mac, 'offline');

                            // Eliminar de la lista de latidos para no seguir procesándolo
                            // (Se volverá a agregar cuando llegue el próximo mensaje 'online')
                            await ESP32Cache.removeHeartbeat(mac);
                        } catch (err) {
                            console.error(`Error marking device ${mac} offline:`, err);
                        }
                    }
                }
            } catch (error) {
                console.error('Heartbeat Monitor Error:', error);
            }
        }, 1000); // Check every 1 seconds
    }
}
