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
