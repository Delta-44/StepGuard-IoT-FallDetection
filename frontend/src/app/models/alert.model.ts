export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'high' | 'medium' | 'low';
  message: string;
  macAddress: string; // MAC address del dispositivo
  timestamp: Date;
  resolved: boolean;
  assignedTo?: string;
  userId?: number; // ID del usuario afectado
  type?: 'fall' | 'inactivity' | 'sos' | 'battery' | 'other'; // Tipo de alerta
  location?: string; // Ubicación de la alerta
}
