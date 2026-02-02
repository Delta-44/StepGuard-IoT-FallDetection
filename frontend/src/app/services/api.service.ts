import { Injectable } from '@angular/core';
import { Observable, timer, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Alert } from '../models/alert.model';
import { Device } from '../models/device';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // 1. BASE DE DATOS EN MEMORIA (El cambio clave)
  // Al sacarlo fuera de la función, los cambios se guardan.
  private mockAlerts: Alert[] = [
    {
      id: '1',
      deviceId: 'Sensor-Pasillo',
      timestamp: new Date(),
      severity: 'critical',
      message: 'Caída detectada en entrada - Sensor detectó impacto',
      resolved: false,
    },
    {
      id: '2',
      deviceId: 'Sensor-Habitacion',
      timestamp: new Date(Date.now() - 600000), 
      severity: 'warning',
      message: 'Inactividad prolongada - Sin movimiento 10 min',
      resolved: true,
    }
  ];

  constructor() { }

  // ==========================================
  // 🚨 LÓGICA DE ALERTAS (DASHBOARD)
  // ==========================================

  getAlertsStream(): Observable<Alert[]> {
    // Emitimos cada 2 segundos
    return timer(0, 2000).pipe(
      map(() => {
        // Devolvemos SIEMPRE la variable 'mockAlerts' (la que tiene memoria)
        // Y ordenamos: Primero las NO resueltas
        return [...this.mockAlerts].sort((a, b) => 
          (a.resolved === b.resolved) ? 0 : a.resolved ? 1 : -1
        );
      })
    );
  }

  // Ahora acepta el nombre de QUIEN atiende la alerta
  markAsResolved(alertId: string, who: string): Observable<boolean> {
    const alert = this.mockAlerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.resolved = true;     // Marcamos como resuelta
      alert.assignedTo = who;    // Guardamos el nombre del cuidador
      console.log(`✅ Alerta ${alertId} atendida por ${who}`);
    }
    
    return of(true);
  }
  
  // ==========================================
  // 📡 LÓGICA DE DISPOSITIVOS
  // ==========================================

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
        sensorData: { accX: 0.12, accY: -0.05, accZ: 9.81, fallDetected: false, temperature: 22.5 }
      },
      {
        id: 'ESP32-002',
        name: 'Sensor Baño',
        location: 'Baño',
        battery: 12,
        status: 'offline', // Simulamos offline
        lastSeen: new Date(Date.now() - 3600000),
        macAddress: 'AA:BB:CC:DD:EE:02',
        sensorData: { accX: -8.23, accY: 2.15, accZ: -1.45, fallDetected: true, temperature: 24.1 }
      },
      {
        id: 'ESP32-003',
        name: 'Sensor Cocina',
        location: 'Cocina',
        battery: 98,
        status: 'online',
        lastSeen: new Date(),
        macAddress: 'AA:BB:CC:DD:EE:03',
        sensorData: { accX: 0.03, accY: 0.08, accZ: 9.79, fallDetected: false, temperature: 21.8 }
      }
    ];
    return of(mockDevices);
  }

  toggleDevice(deviceId: string): Observable<boolean> {
    console.log(`🔌 Reiniciando dispositivo ${deviceId}...`);
    return of(true);
  }
}