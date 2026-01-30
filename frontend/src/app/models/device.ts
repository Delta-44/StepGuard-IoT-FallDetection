export interface Device {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'warning' | 'maintenance';
  battery: number;
  lastSeen: Date;
  sensorData?: {
    accX: number;
    accY: number;
    accZ: number;
    fallDetected: boolean;
    temperature?: number;
  };
  macAddress?: string;
}

