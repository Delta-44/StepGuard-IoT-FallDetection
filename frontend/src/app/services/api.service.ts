import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Alert } from '../models/alert.model';
import { Device } from '../models/device';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
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
      status: 'pendiente',
    },
    {
      id: 'alert-2',
      macAddress: 'AA:BB:CC:DD:EE:03',
      timestamp: new Date(Date.now() - 5000),
      severity: 'critical',
      message: '🔥 Temperatura crítica (>60ºC) detectada',
      resolved: false,
      status: 'pendiente',
    },
    {
      id: 'alert-3',
      macAddress: 'AA:BB:CC:DD:EE:01',
      timestamp: new Date(Date.now() - 3600000),
      severity: 'warning',
      message: '⚠️ Batería baja (15%)',
      resolved: false,
      status: 'pendiente',
    },
  ];

  // 🆕 AHORA LOS DISPOSITIVOS SON PERSISTENTES EN MEMORIA
  // Coinciden con la estructura actualizada del backend
  private mockDevices: Device[] = [
    // 🔴 DISPOSITIVO ESP32 REAL DEL USUARIO
    // La MAC se configura en environment.ts
    {
      mac_address: environment.realESP32Mac,
      nombre: '🌟 ESP32-StepGuard-REAL',
      estado: false, // Offline por defecto
      total_impactos: 0,
      ultima_magnitud: 0,
      fecha_registro: new Date(),
      ultima_conexion: new Date(Date.now() - 86400000), // Hace 24 horas
      esp32Data: {
        macAddress: environment.realESP32Mac,
        name: 'ESP32-StepGuard-REAL',
        impact_count: 0,
        impact_magnitude: 0,
        timestamp: new Date(Date.now() - 86400000),
        status: false,
        isFallDetected: false,
        isButtonPressed: false,
      },
      assignedUser: 'Usuario Real',
    },
    // DISPOSITIVOS MOCK PARA TESTING
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
        isButtonPressed: false,
      },
      assignedUser: 'Ana García',
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
        isButtonPressed: false,
      },
      assignedUser: 'Juan Pérez',
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
        isButtonPressed: false,
      },
    },
    {
      mac_address: 'AA:BB:CC:DD:EE:04',
      nombre: 'ESP32-Dormitorio-Principal',
      estado: true,
      total_impactos: 1,
      ultima_magnitud: 0.8,
      fecha_registro: new Date(),
      ultima_conexion: new Date(),
      esp32Data: {
        macAddress: 'AA:BB:CC:DD:EE:04',
        name: 'ESP32-Dormitorio-Principal',
        impact_count: 1,
        impact_magnitude: 0.8,
        timestamp: new Date(),
        status: true,
        isFallDetected: false,
        isButtonPressed: false,
      },
      assignedUser: 'María López',
    },
    {
      mac_address: 'AA:BB:CC:DD:EE:05',
      nombre: 'ESP32-Pasillo',
      estado: false,
      total_impactos: 7,
      ultima_magnitud: 3.2,
      fecha_registro: new Date(),
      ultima_conexion: new Date(Date.now() - 7200000),
      esp32Data: {
        macAddress: 'AA:BB:CC:DD:EE:05',
        name: 'ESP32-Pasillo',
        impact_count: 7,
        impact_magnitude: 3.2,
        timestamp: new Date(Date.now() - 7200000),
        status: false,
        isFallDetected: false,
        isButtonPressed: false,
      },
    },
    {
      mac_address: 'AA:BB:CC:DD:EE:06',
      nombre: 'ESP32-Comedor',
      estado: true,
      total_impactos: 4,
      ultima_magnitud: 1.9,
      fecha_registro: new Date(),
      ultima_conexion: new Date(),
      esp32Data: {
        macAddress: 'AA:BB:CC:DD:EE:06',
        name: 'ESP32-Comedor',
        impact_count: 4,
        impact_magnitude: 1.9,
        timestamp: new Date(),
        status: true,
        isFallDetected: false,
        isButtonPressed: false,
      },
      assignedUser: 'Pedro Martínez',
    },
    {
      mac_address: 'AA:BB:CC:DD:EE:07',
      nombre: 'ESP32-Terraza',
      estado: true,
      total_impactos: 2,
      ultima_magnitud: 1.5,
      fecha_registro: new Date(),
      ultima_conexion: new Date(),
      esp32Data: {
        macAddress: 'AA:BB:CC:DD:EE:07',
        name: 'ESP32-Terraza',
        impact_count: 2,
        impact_magnitude: 1.5,
        timestamp: new Date(),
        status: true,
        isFallDetected: false,
        isButtonPressed: false,
      },
    },
    {
      mac_address: 'AA:BB:CC:DD:EE:08',
      nombre: 'ESP32-Garaje',
      estado: false,
      total_impactos: 15,
      ultima_magnitud: 6.7,
      fecha_registro: new Date(),
      ultima_conexion: new Date(Date.now() - 10800000),
      esp32Data: {
        macAddress: 'AA:BB:CC:DD:EE:08',
        name: 'ESP32-Garaje',
        impact_count: 15,
        impact_magnitude: 6.7,
        timestamp: new Date(Date.now() - 10800000),
        status: false,
        isFallDetected: false,
        isButtonPressed: false,
      },
      assignedUser: 'Carmen Ruiz',
    },
    {
      mac_address: 'AA:BB:CC:DD:EE:09',
      nombre: 'ESP32-Estudio',
      estado: true,
      total_impactos: 6,
      ultima_magnitud: 2.3,
      fecha_registro: new Date(),
      ultima_conexion: new Date(),
      esp32Data: {
        macAddress: 'AA:BB:CC:DD:EE:09',
        name: 'ESP32-Estudio',
        impact_count: 6,
        impact_magnitude: 2.3,
        timestamp: new Date(),
        status: true,
        isFallDetected: false,
        isButtonPressed: false,
      },
    },
    {
      mac_address: 'AA:BB:CC:DD:EE:10',
      nombre: 'ESP32-Jardín',
      estado: true,
      total_impactos: 8,
      ultima_magnitud: 2.8,
      fecha_registro: new Date(),
      ultima_conexion: new Date(),
      esp32Data: {
        macAddress: 'AA:BB:CC:DD:EE:10',
        name: 'ESP32-Jardín',
        impact_count: 8,
        impact_magnitude: 2.8,
        timestamp: new Date(),
        status: true,
        isFallDetected: false,
        isButtonPressed: false,
      },
      assignedUser: 'Luis Fernández',
    },
    {
      mac_address: 'AA:BB:CC:DD:EE:11',
      nombre: 'ESP32-Habitación-Invitados',
      estado: false,
      total_impactos: 0,
      ultima_magnitud: 0,
      fecha_registro: new Date(),
      ultima_conexion: new Date(Date.now() - 14400000),
      esp32Data: {
        macAddress: 'AA:BB:CC:DD:EE:11',
        name: 'ESP32-Habitación-Invitados',
        impact_count: 0,
        impact_magnitude: 0,
        timestamp: new Date(Date.now() - 14400000),
        status: false,
        isFallDetected: false,
        isButtonPressed: false,
      },
    },
    {
      mac_address: 'AA:BB:CC:DD:EE:12',
      nombre: 'ESP32-Lavandería',
      estado: true,
      total_impactos: 9,
      ultima_magnitud: 3.1,
      fecha_registro: new Date(),
      ultima_conexion: new Date(),
      esp32Data: {
        macAddress: 'AA:BB:CC:DD:EE:12',
        name: 'ESP32-Lavandería',
        impact_count: 9,
        impact_magnitude: 3.1,
        timestamp: new Date(),
        status: true,
        isFallDetected: false,
        isButtonPressed: false,
      },
      assignedUser: 'Sofía Hernández',
    },
    {
      mac_address: 'AA:BB:CC:DD:EE:13',
      nombre: 'ESP32-Biblioteca',
      estado: true,
      total_impactos: 2,
      ultima_magnitud: 1.1,
      fecha_registro: new Date(),
      ultima_conexion: new Date(),
      esp32Data: {
        macAddress: 'AA:BB:CC:DD:EE:13',
        name: 'ESP32-Biblioteca',
        impact_count: 2,
        impact_magnitude: 1.1,
        timestamp: new Date(),
        status: true,
        isFallDetected: false,
        isButtonPressed: false,
      },
    },
    {
      mac_address: 'AA:BB:CC:DD:EE:14',
      nombre: 'ESP32-Gimnasio',
      estado: false,
      total_impactos: 20,
      ultima_magnitud: 9.2,
      fecha_registro: new Date(),
      ultima_conexion: new Date(Date.now() - 5400000),
      esp32Data: {
        macAddress: 'AA:BB:CC:DD:EE:14',
        name: 'ESP32-Gimnasio',
        impact_count: 20,
        impact_magnitude: 9.2,
        timestamp: new Date(Date.now() - 5400000),
        status: false,
        isFallDetected: true,
        isButtonPressed: false,
      },
      assignedUser: 'Roberto Sánchez',
    },
    {
      mac_address: 'AA:BB:CC:DD:EE:15',
      nombre: 'ESP32-Recibidor',
      estado: true,
      total_impactos: 3,
      ultima_magnitud: 1.7,
      fecha_registro: new Date(),
      ultima_conexion: new Date(),
      esp32Data: {
        macAddress: 'AA:BB:CC:DD:EE:15',
        name: 'ESP32-Recibidor',
        impact_count: 3,
        impact_magnitude: 1.7,
        timestamp: new Date(),
        status: true,
        isFallDetected: false,
        isButtonPressed: false,
      },
    },
  ];

  constructor() {}

  // ==========================================
  // 🚨 LÓGICA DE ALERTAS
  // ==========================================

  getAlertsStream(): Observable<Alert[]> {
    return timer(0, 2000).pipe(
      map(() => {
        // Devolvemos las alertas ordenadas: No resueltas primero
        return [...this.mockAlerts].sort((a, b) =>
          a.resolved === b.resolved ? 0 : a.resolved ? 1 : -1,
        );
      }),
    );
  }

  markAsResolved(alertId: string, who: string): Observable<boolean> {
    const alert = this.mockAlerts.find((a) => a.id === alertId);
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
    // Devolver los dispositivos mock y enriquecerlos con datos reales del backend
    return of(this.mockDevices).pipe(
      map((devices) => {
        // Para cada dispositivo, intentar obtener datos actualizados del backend
        devices.forEach((device) => {
          // Hacer una llamada asíncrona para obtener datos reales del ESP32
          this.http.get<any>(`${this.apiUrl}/esp32/data/${device.mac_address}`).subscribe({
            next: (realData) => {
              // Actualizar el dispositivo con datos reales del backend
              if (realData) {
                device.esp32Data = {
                  macAddress: device.mac_address,
                  name: device.nombre,
                  impact_count: realData.impact_count || device.total_impactos,
                  impact_magnitude: realData.impact_magnitude || device.ultima_magnitud,
                  timestamp: realData.timestamp ? new Date(realData.timestamp) : new Date(),
                  status: realData.status !== undefined ? realData.status : device.estado,
                  isFallDetected: realData.isFallDetected || false,
                  isButtonPressed: realData.isButtonPressed || false,
                };

                // Actualizar también los campos principales
                device.estado = realData.status !== undefined ? realData.status : device.estado;
                device.total_impactos = realData.impact_count || device.total_impactos;
                device.ultima_magnitud = realData.impact_magnitude || device.ultima_magnitud;
                device.ultima_conexion = realData.timestamp
                  ? new Date(realData.timestamp)
                  : device.ultima_conexion;

                console.log(`✅ Datos reales obtenidos para ${device.mac_address}:`, realData);
              }
            },
            error: (err) => {
              console.warn(
                `⚠️ No se pudieron obtener datos reales para ${device.mac_address}, usando datos mock`,
              );
              // Si falla, mantener los datos mock
            },
          });
        });

        return devices;
      }),
    );
  }

  // Ejemplo: Función para reiniciar o cambiar estado (simulado)
  toggleDevice(macAddress: string): Observable<boolean> {
    const device = this.mockDevices.find((d) => d.mac_address === macAddress);
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

  // 🆕 Obtener historial de alertas (Real + Mock)
  async getEvents(userId?: string): Promise<Alert[]> {
    try {
      // 1. Obtener alertas reales del backend
      let url = `${this.apiUrl}/events`;
      if (userId) url += `?userId=${userId}`;

      const realEvents: any[] = (await this.http.get<any[]>(url).toPromise()) || [];

      const mappedEvents = realEvents.map((e) => ({
        id: String(e.id),
        macAddress: e.dispositivo_mac,
        userId: e.usuario_id,
        severity: e.severidad,
        status: e.estado,
        message: e.notas || (e.severidad === 'critical' ? 'Caída Detectada' : 'Alerta de Sensor'),
        location: e.ubicacion || 'Desconocida',
        timestamp: new Date(e.fecha_hora),
        attendedBy: e.atendido_por,
        resolutionNotes: e.notas,
        resolved: e.estado === 'atendida' || e.estado === 'falsa_alarma',
      })) as Alert[];

      return mappedEvents;
    } catch (error) {
      console.error('Error fetching real events, falling back to mocks:', error);
      return [];
    }
  }

  // 🆕 Obtener dispositivo por MAC address con datos en tiempo real
  async getDeviceByMac(macAddress: string): Promise<Device | null> {
    try {
      // 1. Intentar endpoint de telemetría primero
      const telemetry = await this.http
        .get<any>(`${this.apiUrl}/esp32/data/${macAddress}`)
        .toPromise();

      if (telemetry) {
        return {
          mac_address: macAddress,
          nombre: `ESP32-${macAddress.slice(-4)}`, // Nombre fallback
          estado: telemetry.status !== undefined ? telemetry.status : false,
          total_impactos: telemetry.impact_count || 0,
          ultima_magnitud: telemetry.impact_magnitude || 0,
          fecha_registro: new Date(),
          ultima_conexion: telemetry.timestamp ? new Date(telemetry.timestamp) : new Date(),
          esp32Data: {
            macAddress: macAddress,
            name: `ESP32-${macAddress.slice(-4)}`,
            impact_count: telemetry.impact_count || 0,
            impact_magnitude: telemetry.impact_magnitude || 0,
            timestamp: telemetry.timestamp ? new Date(telemetry.timestamp) : new Date(),
            status: telemetry.status !== undefined ? telemetry.status : false,
            isFallDetected: telemetry.isFallDetected || false,
            isButtonPressed: telemetry.isButtonPressed || false,
          },
        };
      }
    } catch (error) {
      // Silent fail to fallback
    }

    // 2. Fallback a mocks si no se encuentra (para demo)
    const mock = this.mockDevices.find((d) => d.mac_address === macAddress);
    return mock || null;
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
        fecha_nacimiento: response.fecha_nacimiento, // ✅ AHORA SÍ!
        edad: response.edad,
        genero: response.genero,
        dispositivo_mac: response.dispositivo?.mac_address || null,
        role: 'user',
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
        role: 'user',
      };
    }
  }
}
