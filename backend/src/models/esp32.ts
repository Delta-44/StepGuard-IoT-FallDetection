export interface ESP32 {
    id: string;
    macAddress: string;
    name: string;
    location: string; // e.g., "Living Room"
    status: 'online' | 'offline' | 'maintenance';
    batteryLevel: number; // 0-100
    temperature?: number; // Internal temperature in Celsius
    firmwareVersion: string;
    lastSeen: Date;
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
    location: 'Unassigned',
    status: 'offline',
    batteryLevel: 100,
    firmwareVersion: '1.0.0',
    lastSeen: new Date(),
    isFallDetected: false,
    config: {
        fallDetectionSensitivity: 'medium',
        reportIntervalMs: 60000,
        ledEnabled: true
    }
});
