import { Injectable } from '@angular/core';
import { Observable, timer, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Alert } from '../models/alert.model';
import { Device } from '../models/device';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // ============================================================
  // 1. BASE DE DATOS SIMULADA (MOCK DATA)
  // Ahora coinciden con la estructura de tu nueva Base de Datos
  // ============================================================

  private mockAlerts: Alert[] = [
    // 🌪️ MODO CAOS: Puedes comentar/descomentar esto para probar
    {
      id: 'alert-1',
      deviceId: 'ESP32-002', // Referencia al ID físico
      timestamp: new Date(),
      severity: 'critical',
      message: '🚨 Caída detectada (Impacto fuerte)',
      resolved: false,
    },
    {
      id: 'alert-2',
      deviceId: 'ESP32-003',
      timestamp: new Date(Date.now() - 5000),
      severity: 'critical',
      message: '🔥 Temperatura crítica (>60ºC) detectada',
      resolved: false,
    },
    {
      id: 'alert-3',
      deviceId: 'ESP32-001',
      timestamp: new Date(Date.now() - 3600000),
      severity: 'warning',
      message: '⚠️ Batería baja (15%)',
      resolved: false,
    }
  ];

  // 🆕 AHORA LOS DISPOSITIVOS SON PERSISTENTES EN MEMORIA
  // Coinciden con tu interfaz Device actualizada
  private mockDevices: Device[] = [
    {
      id: '1',                  // ID interno de la BD
      deviceId: 'ESP32-001',    // ID físico (etiqueta)
      name: 'Sensor Salón',
      location: 'Salón Principal',
      status: 'online',
      batteryLevel: 85,         
      macAddress: 'AA:BB:CC:DD:EE:01',
      firmwareVersion: 'v1.0.2',
      sensitivity: 'medium',
      lastSeen: new Date(),
      sensorData: { accX: 0.12, accY: -0.05, accZ: 9.81, fallDetected: false, temperature: 22.5 },
      assignedUser: 'Ana García'
    },
    {
      id: '2',
      deviceId: 'ESP32-002',
      name: 'Sensor Baño',
      location: 'Baño',
      status: 'offline',       // Simulamos fallo
      batteryLevel: 12,
      macAddress: 'AA:BB:CC:DD:EE:02',
      firmwareVersion: 'v1.0.0',
      sensitivity: 'high',     // Más sensible en el baño
      lastSeen: new Date(Date.now() - 3600000), // Hace 1 hora
      sensorData: { accX: -8.23, accY: 2.15, accZ: -1.45, fallDetected: true, temperature: 24.1 },
      assignedUser: 'Juan Pérez'
    },
    {
      id: '3',
      deviceId: 'ESP32-003',
      name: 'Sensor Cocina',
      location: 'Cocina',
      status: 'online',
      batteryLevel: 98,
      macAddress: 'AA:BB:CC:DD:EE:03',
      firmwareVersion: 'v1.1.0',
      sensitivity: 'low',
      lastSeen: new Date(),
      sensorData: { accX: 0.03, accY: 0.08, accZ: 9.79, fallDetected: false, temperature: 21.8 }
    }
  ];

  constructor() { }

  // ==========================================
  // 🚨 LÓGICA DE ALERTAS
  // ==========================================

  getAlertsStream(): Observable<Alert[]> {
    return timer(0, 2000).pipe(
      map(() => {
        // Devolvemos las alertas ordenadas: No resueltas primero
        return [...this.mockAlerts].sort((a, b) => 
          (a.resolved === b.resolved) ? 0 : a.resolved ? 1 : -1
        );
      })
    );
  }

  markAsResolved(alertId: string, who: string): Observable<boolean> {
    const alert = this.mockAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.assignedTo = who;
      console.log(`✅ Alerta ${alertId} atendida por ${who}`);
    }
    return of(true);
  }
  
  // ==========================================
  // 📡 LÓGICA DE DISPOSITIVOS
  // ==========================================

  getDevices(): Observable<Device[]> {
    // Simulamos un pequeño retardo de red como si viniera del Backend real
    return of(this.mockDevices); 
  }

  // Ejemplo: Función para reiniciar o cambiar estado (simulado)
  toggleDevice(deviceId: string): Observable<boolean> {
    const device = this.mockDevices.find(d => d.deviceId === deviceId);
    if (device) {
      console.log(`🔌 Reiniciando dispositivo ${deviceId}...`);
      // Simulamos que se reinicia y vuelve a estar online/offline
      device.status = device.status === 'online' ? 'offline' : 'online';
      device.lastSeen = new Date();
    }
    return of(true);
  }
}