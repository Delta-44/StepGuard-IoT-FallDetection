import { ESP32Cache } from '../config/redis';

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

        // 1. Save current state
        await ESP32Cache.setDeviceData(macAddress, telemetry);

        // 2. Add to history
        await ESP32Cache.addDeviceHistory(macAddress, telemetry);

        // 3. Update status
        // If the device sends 'status' in body, use it. Otherwise assume online (true).
        const status = telemetry.status !== undefined ? telemetry.status : true;
        await ESP32Cache.setDeviceStatus(macAddress, status);

        // 4. Check for fall detection
        if (telemetry.isFallDetected) {
            await ESP32Cache.setFallAlert(macAddress, telemetry);
            console.log(`⚠️ FALL DETECTED for device ${macAddress} (Magnitude: ${telemetry.impact_magnitude})`);
        }

        // 5. Check for button press
        if (telemetry.isButtonPressed) {
            console.log(`🔘 SOS BUTTON PRESSED for device ${macAddress}`);
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
