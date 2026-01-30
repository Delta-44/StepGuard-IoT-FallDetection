import { Injectable } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Alert } from '../models/alert.model';
import { Device } from '../models/device'; // <--- Asegúrate de tener este modelo creado

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor() { }

  // ==========================================
  // 🚨 LÓGICA DE ALERTAS (DASHBOARD)
  // ==========================================

  getAlertsStream(): Observable<Alert[]> {
    return timer(0, 3000).pipe(
      switchMap(() => {
        return of(this.generateMockAlerts()); 
      })
    );
  }

  markAsResolved(alertId: string): Observable<boolean> {
    console.log(`Lógica: Resolviendo alerta ${alertId}...`);
    return of(true);
  }

  // En api.service.ts

  private generateMockAlerts(): Alert[] {
    return [
      {
        id: '1',
        deviceId: 'Sensor-Pasillo',
        timestamp: new Date(),
        severity: 'critical',
        message: 'Caída detectada en entrada',
        description: 'Sensor detectó impacto y aceleración anormal',
        resolved: false
      },
      {
        id: '2',
        deviceId: 'Sensor-Habitacion',
        timestamp: new Date(Date.now() - 600000), 
        severity: 'medium',
        message: 'Inactividad prolongada',
        description: 'No se detectó movimiento en los últimos 10 minutos',
        resolved: true
      }
    ];
  }

  // ==========================================
  // 📡 LÓGICA DE DISPOSITIVOS (LO QUE TE FALTABA)
  // ==========================================

  // Método que faltaba: Obtener lista de sensores
  getDevices(): Observable<Device[]> {
    const mockDevices: Device[] = [
      {
        id: 'ESP32-001',
        name: 'Sensor Salón',
        location: 'Salón Principal',
        battery: 85,
        status: 'online',
        lastSeen: new Date(),
        macAddress: 'AA:BB:CC:DD:EE:01',
        sensorData: {
          accX: 0.12,
          accY: -0.05,
          accZ: 9.81,
          fallDetected: false,
          temperature: 22.5
        }
      },
      {
        id: 'ESP32-002',
        name: 'Sensor Baño',
        location: 'Baño',
        battery: 12, // Batería crítica
        status: 'offline',
        lastSeen: new Date(Date.now() - 3600000), // Hace 1 hora
        macAddress: 'AA:BB:CC:DD:EE:02',
        sensorData: {
          accX: -8.23,
          accY: 2.15,
          accZ: -1.45,
          fallDetected: true, // ⚠️ CAÍDA DETECTADA
          temperature: 24.1
        }
      },
      {
        id: 'ESP32-003',
        name: 'Sensor Cocina',
        location: 'Cocina',
        battery: 98,
        status: 'online',
        lastSeen: new Date(),
        macAddress: 'AA:BB:CC:DD:EE:03',
        sensorData: {
          accX: 0.03,
          accY: 0.08,
          accZ: 9.79,
          fallDetected: false,
          temperature: 21.8
        }
      }
    ];
    return of(mockDevices);
  }

  // Método que faltaba: Reiniciar un sensor
  toggleDevice(deviceId: string): Observable<boolean> {
    console.log(`🔌 Lógica: Enviando comando de reinicio a ${deviceId}...`);
    // Simulamos que tarda 1 segundo en reiniciar
    return of(true);
  }
}