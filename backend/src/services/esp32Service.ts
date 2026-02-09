import { ESP32Cache } from '../config/redis';
import { DispositivoModel } from '../models/dispositivo';
import { EventoCaidaModel } from '../models/eventoCaida';
import { AlertService } from './alertService';

export class ESP32Service {
    /**
     * Process incoming telemetry data from either HTTP or MQTT
     * @param data - The raw data payload
     * @returns Processed data object or throws error
     */
    static async processTelemetry(data: any) {
        const { macAddress, ...telemetry } = data;

        if (!macAddress) {
            throw new Error('Mac Address is required');
        }

        // 1. Save current state to Redis
        await ESP32Cache.setDeviceData(macAddress, telemetry);

        // 2. Add to history in Redis
        await ESP32Cache.addDeviceHistory(macAddress, telemetry);

        // 3. Update status in Redis -> MOVED to separate method
        // processTelemetry no longer handles status updates based on payload

        // 4. Persistence to PostgreSQL
        try {
            // Try to update existing device
            const updatedDevice = await DispositivoModel.actualizarDatosESP32(
                macAddress,
                telemetry.impact_count || 0,
                telemetry.impact_magnitude
            );

            if (!updatedDevice) {
                console.log(`New device detected: ${macAddress}. Auto-creating...`);
                // Auto-create device if it doesn't exist
                const defaultName = `ESP32 Device ${macAddress}`;
                await DispositivoModel.create(macAddress, defaultName);

                // Update with the fresh data
                await DispositivoModel.actualizarDatosESP32(
                    macAddress,
                    telemetry.impact_count || 0,
                    telemetry.impact_magnitude
                );
            }
        } catch (dbError) {
            console.error('Error persisting to PostgreSQL:', dbError);
            // Non-blocking error: we continue even if DB write fails (Redis is primary for realtime)
        }

        // 5. Check for fall detection and button press
        if (telemetry.isFallDetected || telemetry.isButtonPressed) {

            // Get user associated with this device
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
     * Get device data by MAC address
     */
    static async getDeviceData(macAddress: string) {
        return await ESP32Cache.getDeviceData(macAddress);
    }

    /**
     * Update device status (online/offline)
     */
    static async updateDeviceStatus(macAddress: string, status: string | boolean) {
        // Normalize status to boolean if it's a string 'online'/'offline' or similar
        let isOnline = false;
        if (typeof status === 'string') {
            isOnline = status.toLowerCase() === 'online';
        } else {
            isOnline = !!status;
        }

        // Check previous status BEFORE updating Redis to detect transitions
        const previousStatus = await ESP32Cache.getDeviceStatus(macAddress);
        console.log(`[DEBUG] Transition Check: Previous=${previousStatus}, New=${isOnline}`);

        await ESP32Cache.setDeviceStatus(macAddress, isOnline);
        console.log(`device ${macAddress} is ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

        // Sync with PostgreSQL IF:
        // 1. New status is OFFLINE
        // 2. OR New status is ONLINE but previous was OFFLINE/UNKNOWN (Transition)
        if (!isOnline || (isOnline && !previousStatus)) {
            try {
                await DispositivoModel.updateEstado(macAddress, isOnline);
                console.log(`Postgres updated: device ${macAddress} transitioned to ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
            } catch (error) {
                console.error(`Error syncing status to Postgres for ${macAddress}:`, error);
            }
        }
    }

    /**
     * Register a heartbeat from a device.
     * Updates the ZSET score and ensures status is online.
     */
    static async registerHeartbeat(macAddress: string) {
        await ESP32Cache.updateHeartbeat(macAddress);

        // Ensure it is marked as online (logic inside handles transition if needed)
        // Optimization: We could check if it's already online to save calls, 
        // but updateDeviceStatus handles transition checks efficiently enough.
        await this.updateDeviceStatus(macAddress, 'online');
    }

    /**
     * Start the background monitor to check for expired heartbeats.
     * Timeout: 17 seconds.
     */
    static startHeartbeatMonitor() {
        console.log('Starting Heartbeat Monitor (17s timeout check every 5s)...');

        setInterval(async () => {
            // console.log('[DEBUG] Heartbeat Monitor Tick'); // Verbose
            try {
                const threshold = Date.now() - 1000; // 1 seconds ago
                const expiredDevices = await ESP32Cache.getExpiredHeartbeats(threshold);
                // console.log(`[DEBUG] Check expired < ${threshold}. Found: ${expiredDevices.length}`);

                if (expiredDevices.length > 0) {
                    console.log(`Found ${expiredDevices.length} expired devices (No heartbeat > 1s). Marking offline...`);

                    for (const mac of expiredDevices) {
                        try {
                            console.log(`Device ${mac} timed out. Marking OFFLINE.`);
                            await this.updateDeviceStatus(mac, 'offline');

                            // Remove from heartbeat list so we don't keep processing it
                            // (It will be re-added when next 'online' msg comes)
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
