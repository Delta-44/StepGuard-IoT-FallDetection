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

        // 3. Update status in Redis
        // If the device sends 'status' in body, use it. Otherwise assume online (true).
        const status = telemetry.status !== undefined ? telemetry.status : true;
        await ESP32Cache.setDeviceStatus(macAddress, status);

        // 4. Persistence to PostgreSQL
        try {
            // Try to update existing device
            const updatedDevice = await DispositivoModel.actualizarDatosESP32(
                macAddress, 
                telemetry.impact_count || 0, 
                telemetry.impact_magnitude
            );

            if (!updatedDevice) {
                console.log(`🆕 New device detected: ${macAddress}. Auto-creating...`);
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
            console.error('❌ Error persisting to PostgreSQL:', dbError);
            // Non-blocking error: we continue even if DB write fails (Redis is primary for realtime)
        }

        // 5. Check for fall detection and button press
        if (telemetry.isFallDetected || telemetry.isButtonPressed) {
            
            // Get user associated with this device
            const usuario = await DispositivoModel.getUsuarioAsignado(macAddress);
            const usuarioId = usuario ? usuario.id : undefined;

            if (telemetry.isFallDetected) {
                await ESP32Cache.setFallAlert(macAddress, telemetry);
                console.log(`⚠️ FALL DETECTED for device ${macAddress} (Magnitude: ${telemetry.impact_magnitude})`);
                
                // Persist fall event
                const fallEvent = await EventoCaidaModel.create(
                    macAddress,
                    usuarioId,
                    0, 0, 0, // TODO: Add real acc data if available in telemetry
                    'high',
                    undefined,
                    'Caída detectada automáticamente'
                );
                console.log('✅ Evento de caída guardado en Postgres');
                
                // Broadcast to frontend
                AlertService.broadcast({
                    type: 'FALL_DETECTED',
                    data: fallEvent
                });
            }

            if (telemetry.isButtonPressed) {
                console.log(`🔘 SOS BUTTON PRESSED for device ${macAddress}`);
                
                // Persist SOS event
                const sosEvent = await EventoCaidaModel.create(
                    macAddress,
                    usuarioId,
                    0, 0, 0,
                    'critical',
                    undefined,
                    'Botón SOS presionado'
                );
                console.log('✅ Evento SOS guardado en Postgres');

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
}
