export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'high' | 'medium' | 'low';
  message: string;
  macAddress: string; // MAC address del dispositivo
  timestamp: Date;
  resolved: boolean;
  status: 'pendiente' | 'atendida' | 'falsa_alarma' | 'ignorada';
  assignedTo?: string;
  userId?: number; // ID del usuario afectado
  deviceId?: string; // ID del dispositivo
  type?: 'fall' | 'inactivity' | 'sos' | 'battery' | 'other'; // Tipo de alerta
  location?: string; // Ubicación de la alerta
  resolutionNotes?: string; // Notas de resolución
  caregiverName?: string; // Nombre del cuidador que atendió
  attendedBy?: any; // ID o nombre del que atendió (backend usa number, frontend a veces string)
  attendedAt?: Date;
  acc_x?: number;
  acc_y?: number;
  acc_z?: number;
  userName?: string; // Nombre del usuario (mapeado desde el backend)
  deviceName?: string; // Nombre del dispositivo o MAC
}
