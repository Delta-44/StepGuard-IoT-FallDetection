// Interfaz ESP32 según el backend
export interface ESP32Data {
  macAddress: string;
  name: string;
  impact_count: number;
  impact_magnitude: number;
  timestamp: Date;
  status: boolean; // true=online, false=offline
  isFallDetected: boolean;
  isButtonPressed: boolean;
}

// Interfaz del dispositivo almacenado en BD
export interface Device {
  mac_address: string;     // PK - Dirección MAC del ESP32
  nombre: string;          // Nombre del dispositivo
  estado: boolean;         // true=activo, false=inactivo
  total_impactos: number;  // Contador de impactos
  ultima_magnitud?: number; // Última magnitud detectada
  fecha_registro?: Date;
  ultima_conexion?: Date;
  
  // Datos en tiempo real del ESP32 (vienen de Redis)
  esp32Data?: ESP32Data;
  assignedUser?: string;   // Nombre del paciente asignado
}