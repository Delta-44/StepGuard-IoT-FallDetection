export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  macAddress: string; // MAC address del dispositivo
  timestamp: Date;
  resolved: boolean;
  assignedTo?: string;
  userId?: number; // ID del usuario afectado
}
