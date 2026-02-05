export interface ESP32 {
    macAddress: string;
    name: string;
    impact_count: number;
    timestamp: Date;
    status: 'online' | 'offline' | 'maintenance';
    isFallDetected: boolean;
}