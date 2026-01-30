export interface Alert {
  id: string;
  deviceId: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'critical';
  description: string;
  resolved: boolean;
}
