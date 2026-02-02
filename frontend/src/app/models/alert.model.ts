export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  deviceId: string;
  timestamp: Date;
  resolved: boolean;
  assignedTo?: string;
}
