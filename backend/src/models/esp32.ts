export interface ESP32 {
    macAddress: string;
    name: string;
    impact_count: number;
    impact_magnitude: number;
    timestamp: Date;
    status: boolean;
    isFallDetected: boolean;
    isButtonPressed: boolean;
}

// Factory function para crear datos de prueba ESP32
export const createDefaultESP32 = (mac: string, name: string): ESP32 => ({
    macAddress: mac,
    name: name,
    impact_count: 0,
    impact_magnitude: 0,
    timestamp: new Date(),
    status: false, // offline por defecto
    isFallDetected: false,
    isButtonPressed: false
});
