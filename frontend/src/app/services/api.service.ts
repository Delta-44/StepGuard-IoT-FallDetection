import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Alert } from '../models/alert.model';
import { Device } from '../models/device';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ============================================================
  // 1. BASE DE DATOS SIMULADA (MOCK DATA)
  // Ahora coinciden con la estructura de tu nueva Base de Datos
  // ============================================================

  private mockAlerts: Alert[] = [
    // 🌪️ MODO CAOS: Puedes comentar/descomentar esto para probar
    {
      id: 'alert-1',
      macAddress: 'AA:BB:CC:DD:EE:02',
      timestamp: new Date(),
      severity: 'critical',
      message: '🚨 Caída detectada (Impacto fuerte)',
      resolved: false,
    },
    {
      id: 'alert-2',
      macAddress: 'AA:BB:CC:DD:EE:03',
      timestamp: new Date(Date.now() - 5000),
      severity: 'critical',
      message: '🔥 Temperatura crítica (>60ºC) detectada',
      resolved: false,
    },
    {
      id: 'alert-3',
      macAddress: 'AA:BB:CC:DD:EE:01',
      timestamp: new Date(Date.now() - 3600000),
      severity: 'warning',
      message: '⚠️ Batería baja (15%)',
      resolved: false,
    }
  ];

  // 🆕 AHORA LOS DISPOSITIVOS SON PERSISTENTES EN MEMORIA
  // Coinciden con la estructura actualizada del backend
  private mockDevices: Device[] = [
    {
      mac_address: 'AA:BB:CC:DD:EE:01',
      nombre: 'ESP32-Sala',
      estado: true,
      total_impactos: 5,
      ultima_magnitud: 2.5,
      fecha_registro: new Date(),
      ultima_conexion: new Date(),
      esp32Data: {
        macAddress: 'AA:BB:CC:DD:EE:01',
        name: 'ESP32-Sala',
        impact_count: 5,
        impact_magnitude: 2.5,
        timestamp: new Date(),
        status: true,
        isFallDetected: false,
        isButtonPressed: false
      },
      assignedUser: 'Ana García'
    },
    {
      mac_address: 'AA:BB:CC:DD:EE:02',
      nombre: 'ESP32-Baño',
      estado: false,
      total_impactos: 12,
      ultima_magnitud: 8.5,
      fecha_registro: new Date(),
      ultima_conexion: new Date(Date.now() - 3600000),
      esp32Data: {
        macAddress: 'AA:BB:CC:DD:EE:02',
        name: 'ESP32-Baño',
        impact_count: 12,
        impact_magnitude: 8.5,
        timestamp: new Date(Date.now() - 3600000),
        status: false,
        isFallDetected: true,
        isButtonPressed: false
      },
      assignedUser: 'Juan Pérez'
    },
    {
      mac_address: 'AA:BB:CC:DD:EE:03',
      nombre: 'ESP32-Cocina',
      estado: true,
      total_impactos: 3,
      ultima_magnitud: 1.2,
      fecha_registro: new Date(),
      ultima_conexion: new Date(),
      esp32Data: {
        macAddress: 'AA:BB:CC:DD:EE:03',
        name: 'ESP32-Cocina',
        impact_count: 3,
        impact_magnitude: 1.2,
        timestamp: new Date(),
        status: true,
        isFallDetected: false,
        isButtonPressed: false
      }
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
  toggleDevice(macAddress: string): Observable<boolean> {
    const device = this.mockDevices.find(d => d.mac_address === macAddress);
    if (device) {
      console.log(`🔌 Reiniciando dispositivo ${macAddress}...`);
      // Simulamos que se reinicia y vuelve a estar online/offline
      device.estado = !device.estado;
      device.ultima_conexion = new Date();
      if (device.esp32Data) {
        device.esp32Data.status = device.estado;
        device.esp32Data.timestamp = new Date();
      }
    }
    return of(true);
  }

  // 🆕 Obtener dispositivo por MAC address desde el backend
  async getDeviceByMac(macAddress: string): Promise<Device | null> {
    try {
      // Usar el nuevo endpoint de devices
      const response = await this.http.get<any>(`${this.apiUrl}/devices/${macAddress}`).toPromise();
      
      if (response) {
        return {
          mac_address: response.mac_address || macAddress,
          nombre: response.nombre || 'Dispositivo',
          estado: response.estado || false,
          total_impactos: response.total_impactos || 0,
          ultima_magnitud: response.ultima_magnitud,
          fecha_registro: response.fecha_registro ? new Date(response.fecha_registro) : new Date(),
          ultima_conexion: response.ultima_conexion ? new Date(response.ultima_conexion) : new Date(),
          esp32Data: response.esp32Data
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo dispositivo del backend:', error);
      return null;
    }
  }

  // 🆕 Obtener usuario por ID desde el backend
  async getUserById(userId: string): Promise<any> {
    try {
      const response = await this.http.get<any>(`${this.apiUrl}/users/${userId}`).toPromise();
      
      // Mapear la respuesta del backend al formato esperado por el frontend
      return {
        id: response.id,
        fullName: response.nombre || response.fullName,
        email: response.email,
        telefono: response.telefono,
        direccion: response.direccion,
        edad: response.edad,
        genero: response.genero,
        dispositivo_mac: response.dispositivo?.mac_address || null,
        role: 'user'
      };
    } catch (error) {
      console.error('Error obteniendo usuario del backend:', error);
      // Fallback a datos mock si falla
      return {
        id: userId,
        fullName: 'Usuario',
        email: 'usuario@ejemplo.com',
        telefono: 'N/A',
        direccion: 'N/A',
        edad: null,
        genero: null,
        dispositivo_mac: null,
        role: 'user'
      };
    }
  }
}