export interface Alert {
  id: string;
  deviceId: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'critical';
  message: string;
  description: string;
  resolved: boolean;
}
