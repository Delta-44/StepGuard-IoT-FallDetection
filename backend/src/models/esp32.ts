export interface ESP32 {
    //complete revision of the ESP32 model, do not toutch too much until the DB is ready
    id: string;
    macAddress: string;
    name: string;
  //  location: string; // e.g., "Living Room"
    status: 'online' | 'offline' | 'maintenance';

    // firmwareVersion: string;

    isFallDetected: boolean;
    config: ESP32Config;
}

export interface ESP32Config {
    fallDetectionSensitivity: 'low' | 'medium' | 'high';
    reportIntervalMs: number;
    ledEnabled: boolean;
}

// Optional: Factory function / Mock data generator since no DB is set up yet
export const createDefaultESP32 = (id: string, mac: string): ESP32 => ({
    id,
    macAddress: mac,
    name: `ESP32-${id}`,
    // location: 'Unassigned',
    status: 'offline',
    //no tocar por ahora
    // firmwareVersion: '1.0.0',
   
    isFallDetected: false,
    config: {
        fallDetectionSensitivity: 'medium',
        reportIntervalMs: 60000,
        ledEnabled: true
    }
});
