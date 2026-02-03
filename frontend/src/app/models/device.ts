export interface DeviceSensorData {
  accX: number;
  accY: number;
  accZ: number;
  fallDetected: boolean;
  temperature: number;
}

export interface Device {
  id: string;            // ID interno de la BD (ej: 1, 2)
  deviceId: string;      // ID físico (ej: "ESP32-001")
  name: string;          // Nombre amigable (ej: "Sensor Salón")
  location: string;      // Ubicación en la casa
  
  // Estado y Batería
  status: 'online' | 'offline' | 'maintenance';
  batteryLevel?: number; // (Ojo: En tu SQL no vi batería, pero el ESP32 suele mandarla. La mantengo por si acaso)
  
  // ✨ NUEVOS CAMPOS TÉCNICOS
  macAddress?: string;
  firmwareVersion?: string;
  sensitivity?: 'low' | 'medium' | 'high';
  lastSeen?: Date;

  // Datos en tiempo real (No se guardan en BD siempre, pero el socket te los manda)
  sensorData?: DeviceSensorData;
  assignedUser?: string; // Nombre del paciente asignado
}