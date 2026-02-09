import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer, of, firstValueFrom } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
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

  private mockAlerts: Alert[] = []; // Ya no se usan mocks de alertas, llegan del backend

  // 🆕 AHORA LOS DISPOSITIVOS SON PERSISTENTES EN MEMORIA
  // Coinciden con la estructura actualizada del backend
  private mockDevices: Device[] = [];

  constructor() {}

  // ==========================================
  // 🚨 LÓGICA DE ALERTAS
  // ==========================================

  getAlertsStream(): Observable<Alert[]> {
    // Polling cada 3 segundos para obtener alertas reales
    // Usamos un rango de fecha amplio (ej. 7 días) para obtener tanto pendientes como historial reciente para estadísticas
    return timer(0, 3000).pipe(
      switchMap(() => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7); // Últimos 7 días

        const params = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        };
        
        return this.http.get<any[]>(`${this.apiUrl}/events`, { params });
      }),
      map((realEvents) => {
        console.log('🔥 Raw Events from Backend:', realEvents);
        return realEvents.map((e) => ({
          id: String(e.id),
          macAddress: e.dispositivo_mac,
          userId: e.usuario_id,
          severity: e.severidad,
          status: e.estado, // 'pendiente', 'atendida', 'falsa_alarma'
          message: e.notas || (e.severidad === 'critical' ? 'Caída Detectada' : 'Alerta de Sensor'),
          location: e.ubicacion || 'Desconocida',
          timestamp: new Date(e.fecha_hora),
          attendedBy: e.atendido_por_nombre || e.atendido_por,
          caregiverName: e.atendido_por_nombre,
          resolutionNotes: e.notas,
          resolved: e.estado === 'atendida' || e.estado === 'falsa_alarma',

          // 🛡️ Fallbacks para asegurar que mostramos la MAC o ID
          deviceName: e.dispositivo_mac || e.device_id || e.dispositivo_id || 'ID Desconocido'
        }));
      }),
      // Si falla la petición, devolver array vacío para no romper el stream
      catchError((err) => {
        console.error('Error polling alerts:', err);
        return of([]);
      })
    );
  }

  markAsResolved(
    alertId: string, 
    who: string, 
    status: 'atendida' | 'falsa_alarma', 
    notes?: string, 
    severity?: string
  ): Observable<boolean> {
    const payload = {
      status,
      notes,
      severity,
      attendedBy: who
    };
    return this.http.put<any>(`${this.apiUrl}/events/${alertId}/resolve`, payload).pipe(
      map(() => {
        console.log(`✅ Alerta ${alertId} resuelta como ${status} en backend`);
        return true;
      }),
      catchError((err) => {
        console.error('Error resolving alert:', err);
        return of(false);
      })
    );
  }

  // ============================================================
  // 2. GESTIÓN DE DISPOSITIVOS (REAL - DATABASE)
  // ============================================================

  getDevices(): Observable<Device[]> {
    return this.http.get<any[]>(`${this.apiUrl}/esp32/all`).pipe(
      map((backendDevices) => {
        return backendDevices.map((d) => {
          return {
            mac_address: d.mac_address,
            nombre: d.nombre,
            estado: d.estado,
            total_impactos: d.total_impactos,
            ultima_magnitud: d.ultima_magnitud || 0,
            fecha_registro: new Date(d.fecha_registro),
            ultima_conexion: d.ultima_conexion ? new Date(d.ultima_conexion) : undefined,
            assignedUser: d.assignedUser || d.assigneduser, 
            
            // Reconstruct esp32Data for frontend compatibility
            esp32Data: {
              macAddress: d.mac_address,
              name: d.nombre,
              impact_count: d.total_impactos,
              impact_magnitude: d.ultima_magnitud || 0,
              timestamp: d.ultima_conexion ? new Date(d.ultima_conexion) : new Date(d.fecha_registro),
              status: d.estado,
              isFallDetected: false, 
              isButtonPressed: false
            }
          } as Device;
        });
      }),
      catchError((error) => {
        console.error('Error fetching devices from backend:', error);
        return of([]);
      })
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

  updateDevice(macAddress: string, data: { nombre: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/esp32/${macAddress}`, data);
  }

  // 🆕 Obtener historial de alertas (Real + Mock)
  async getEvents(userId?: string): Promise<Alert[]> {
    try {
      // 1. Obtener alertas reales del backend (Últimos 7 días por defecto para ver historial)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      let url = `${this.apiUrl}/events`;
      
      const params: any = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      if (userId) {
        params.userId = userId;
      }

      // Usar firstValueFrom en lugar de toPromise() para mejor compatibilidad con interceptores
      const realEvents: any[] = await firstValueFrom(this.http.get<any[]>(url, { params }));

      const mappedEvents = realEvents.map((e) => ({
        id: String(e.id),
        macAddress: e.dispositivo_mac,
        userId: e.usuario_id,
        severity: e.severidad,
        status: e.estado,
        message: e.notas || (e.severidad === 'critical' ? 'Caída Detectada' : 'Alerta de Sensor'),
        location: e.ubicacion || 'Desconocida',
        timestamp: new Date(e.fecha_hora),
        attendedBy: e.atendido_por_nombre || e.atendido_por,
        caregiverName: e.atendido_por_nombre,
        resolutionNotes: e.notas,
        resolved: e.estado === 'atendida' || e.estado === 'falsa_alarma',
        // Mapeo de nuevos campos
        acc_x: e.acc_x,
        acc_y: e.acc_y,
        acc_z: e.acc_z,
        userName: e.usuario_nombre,
      })) as Alert[];

      console.log(`✅ Successfully fetched ${mappedEvents.length} real events from backend`);
      return mappedEvents;
    } catch (error: any) {
      console.error('❌ Error fetching real events from backend:', error);
      if (error.status) {
        console.error(`HTTP Error ${error.status}: ${error.statusText}`);
        console.error('URL:', error.url);
      }
      console.log('Falling back to empty array (no mock data)');
      return [];
    }
  }

  // 🆕 Obtener dispositivo por MAC address con datos en tiempo real
  async getDeviceByMac(macAddress: string): Promise<Device | null> {
    try {
      // 1. Intentar endpoint de telemetría primero
      const telemetry = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/esp32/data/${macAddress}`)
      );

      if (telemetry) {
        return {
          mac_address: macAddress,
          nombre: telemetry.name || `ESP32-${macAddress.slice(-4)}`,
          estado: telemetry.status !== undefined ? telemetry.status : false,
          total_impactos: telemetry.impact_count || 0,
          ultima_magnitud: telemetry.impact_magnitude || 0,
          fecha_registro: new Date(),
          ultima_conexion: telemetry.timestamp ? new Date(telemetry.timestamp) : new Date(),
          esp32Data: {
            macAddress: macAddress,
            name: telemetry.name || `ESP32-${macAddress.slice(-4)}`,
            impact_count: telemetry.impact_count || 0,
            impact_magnitude: telemetry.impact_magnitude || 0,
            timestamp: telemetry.timestamp ? new Date(telemetry.timestamp) : new Date(),
            status: telemetry.status !== undefined ? telemetry.status : false,
            isFallDetected: telemetry.isFallDetected || false,
            isButtonPressed: telemetry.isButtonPressed || false,
          },
        };
      }
    } catch (error: any) {
      console.warn(`📡 Telemetry not found for ${macAddress}, falling back to registry...`);
    }

    // 2. Fallback: Buscar en la lista general de dispositivos si no hay telemetría (dispositivos nuevos)
    try {
      const allDevices = await firstValueFrom(this.getDevices());
      const device = allDevices.find(d => d.mac_address === macAddress);
      if (device) return device;
    } catch (e) {
      console.error('❌ Error fetching devices list as fallback:', e);
    }

    return null;
  }

  // 🆕 Obtener usuario por ID desde el backend
  async getUserById(userId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/users/${userId}`)
      );
      console.log('📦 getUserById RAW response:', response);

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
        created_at: response.createdAt || response.created_at, // 👈 Mapeamos fechas
        updated_at: response.updatedAt || response.updated_at, // 👈 Mapeamos fechas
        role: response.role || 'user', // Asegurar que el rol venga del backend o default a user
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
