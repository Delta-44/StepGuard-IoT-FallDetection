import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs'; // 👈 Añadido Subject
import { Alert } from '../models/alert.model';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  // MOCK DATA INICIAL
  private mockAlerts: Alert[] = [
    {
      id: '201',
      severity: 'critical',
      status: 'pendiente',
      message: 'Caída detectada (Alto Impacto)',
      location: 'Dormitorio',
      macAddress: 'AA:BB:CC:DD:EE:01',
      userId: 1,
      timestamp: new Date(),
      acc_x: 2.5,
      acc_y: -0.1,
      acc_z: 0.3,
      resolved: false,
    },
  ];

  // ESTRUCTURA REACTIVA
  private alertsSubject = new BehaviorSubject<Alert[]>(this.mockAlerts);
  alerts$ = this.alertsSubject.asObservable();

  // 👇 NUEVO: Canal de Notificaciones para el Toast
  public alertNotification$ = new Subject<Alert>();

  public currentActiveAlert: Alert | null = null;
  private apiService = inject(ApiService);
  private authService = inject(AuthService); // Inject AuthService if needed for token
  private eventSource: EventSource | null = null;

  constructor() {
    // Solo inicializar si hay un usuario autenticado
    // Esto previene que las alertas se muestren en la landing page
    const token = this.authService.getToken();
    
    if (token) {
      console.log('✅ Usuario autenticado detectado, inicializando AlertService...');
      
      // 1. Cargar historial inicial (Real + Mock)
      this.loadInitialHistory();

      // 2. Conectar a Real-Time SSE
      this.connectToRealTimeAlerts();

      // 3. Mantener simulación (Hybrid Mode)
      setTimeout(() => this.startSimulation(), 5000);
    } else {
      console.log('ℹ️ No hay usuario autenticado, AlertService en espera...');
    }
  }

  // Método público para inicializar manualmente después del login
  public initialize() {
    const token = this.authService.getToken();
    
    if (!token) {
      console.warn('⚠️ No se puede inicializar AlertService sin token');
      return;
    }

    console.log('🔄 Inicializando AlertService después del login...');
    
    // Cargar historial
    this.loadInitialHistory();
    
    // Conectar SSE
    this.connectToRealTimeAlerts();
    
    // Iniciar simulación
    setTimeout(() => this.startSimulation(), 5000);
  }

  private async loadInitialHistory() {
    console.log('🔄 Loading alert history...');
    try {
      const realHistory = await this.apiService.getEvents(); // Fetch real events

      // Merge with mocks (optional: prioritize real)
      const merged = [...realHistory, ...this.mockAlerts];

      // Sort by date desc
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      this.alertsSubject.next(merged);
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }

  private connectToRealTimeAlerts() {
    const token = this.authService.getToken(); // Assuming AuthService has this method or similar
    
    if (!token) {
      console.warn('⚠️ No auth token found, skipping SSE connection');
      return;
    }

    // Validate token format (basic check)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('❌ Invalid JWT token format (expected 3 parts, got ' + tokenParts.length + ')');
      return;
    }

    console.log('🔐 Token validated, connecting to SSE with token:', token.substring(0, 20) + '...');

    // Close existing connection if any
    if (this.eventSource) {
      this.eventSource.close();
    }

    const streamUrl = `${environment.apiUrl}/alerts/stream?token=${token}`;
    console.log('📡 Connecting to SSE:', streamUrl.replace(token, 'TOKEN_HIDDEN'));

    this.eventSource = new EventSource(streamUrl);

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('⚡ Real-time alert received:', data);

        if (data.type === 'FALL_DETECTED' || data.type === 'sos_button') {
          this.handleRealAlert(data.data);
        } else if (data.type === 'EVENT_RESOLVED') {
          this.handleEventResolved(data.data);
        }
      } catch (err) {
        console.error('Error parsing SSE event', err);
      }
    };

    this.eventSource.onerror = (err) => {
      console.error('❌ SSE Error:', err);
      console.error('SSE ReadyState:', this.eventSource?.readyState);
      
      // ReadyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
      if (this.eventSource?.readyState === 2) {
        console.log('SSE connection closed.');
        console.warn('⚠️ Si ves error 401, tu token expiró. Cierra sesión y vuelve a iniciar sesión.');
      }
      
      // Cerrar conexión
      this.eventSource?.close();
      
      // RECONEXIÓN DESHABILITADA TEMPORALMENTE
      // Para evitar spam de errores cuando el token está expirado
      // Descomenta las siguientes líneas cuando el token esté actualizado:
      
      // setTimeout(() => {
      //   console.log('🔄 Attempting to reconnect to SSE...');
      //   this.connectToRealTimeAlerts();
      // }, 5000);
    };

    this.eventSource.onopen = () => {
      console.log('✅ SSE connection established successfully');
    };
  }

  private handleRealAlert(backendEvent: any) {
    const newAlert: Alert = {
      id: String(backendEvent.id),
      macAddress: backendEvent.dispositivo_mac,
      userId: backendEvent.usuario_id,
      severity: backendEvent.severidad,
      status: backendEvent.estado,
      message: backendEvent.notas || 'Nueva Alerta Detectada',
      location: backendEvent.ubicacion || 'Desconocida',
      timestamp: new Date(backendEvent.fecha_hora),
      resolved: false,
    };

    // Add to stream
    const current = this.alertsSubject.value;
    this.alertsSubject.next([newAlert, ...current]);

    // Notify Toast
    this.alertNotification$.next(newAlert);
  }

  private handleEventResolved(backendEvent: any) {
    const current = this.alertsSubject.value;
    const index = current.findIndex((a) => a.id === String(backendEvent.id));

    if (index !== -1) {
      const updated = [...current];
      updated[index] = {
        ...updated[index],
        status: backendEvent.estado as any,
        attendedBy: String(backendEvent.atendido_por), // ID to string for simplicity
        resolved: true,
        resolutionNotes: backendEvent.notas,
      };
      this.alertsSubject.next(updated);
    }
  }

  // Genera una alerta aleatoria cada 30 segundos (optimización de rendimiento)
  private startSimulation() {
    setInterval(() => {
      this.generateRandomAlert();
    }, 30000);
  }

  private generateRandomAlert() {
    const locations = ['Baño', 'Cocina', 'Salón', 'Jardín', 'Dormitorio'];
    // Solo permitimos Golpes y Caídas por limitación del hardware del dispositivo
    const messages = ['Caída detectada', 'Golpe fuerte detectado', 'Batería baja'];

    // Seleccionar tipo de evento
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];

    // Lógica de severidad basada en el tipo de evento
    let finalSeverity: Alert['severity'] = 'medium';

    if (randomMsg === 'Caída detectada') {
      finalSeverity = 'critical'; // Las caídas siempre son críticas
    } else {
      finalSeverity = 'high'; // Los golpes fuertes son de severidad alta
    }

    const newAlert: Alert = {
      id: 'mock-' + Date.now().toString(),
      macAddress: `AA:BB:CC:DD:EE:0${Math.floor(Math.random() * 3) + 1}`,
      userId: Math.floor(Math.random() * 3) + 1,
      severity: finalSeverity,
      status: 'pendiente',
      message: randomMsg,
      location: locations[Math.floor(Math.random() * locations.length)],
      timestamp: new Date(),
      acc_x: Math.random() * 2, // Simulamos valores un poco más altos
      acc_y: Math.random() * 2,
      acc_z: 9.8 + Math.random() * 5, // Impacto en eje Z
      resolved: false,
    };

    // Añadir al principio de la lista
    const currentAlerts = this.alertsSubject.value;
    this.alertsSubject.next([newAlert, ...currentAlerts]);

    // 👇 DISPARAR LA NOTIFICACIÓN
    this.alertNotification$.next(newAlert);

    console.log('🤖 Simulación: Nueva alerta generada', newAlert.message);
  }

  // --- MÉTODOS PÚBLICOS ---

  getAllAlerts(): Observable<Alert[]> {
    return this.alerts$;
  }

  getAlertsByDeviceId(id: string): Observable<Alert[]> {
    const current = this.alertsSubject.value;
    const filtered = current.filter(
      (a) => a.macAddress === id || (a.userId && String(a.userId) === id),
    );
    return new Observable((obs) => obs.next(filtered));
  }

  getAlertsByCaregiver(caregiverName: string): Observable<Alert[]> {
    const current = this.alertsSubject.value;
    const filtered = current.filter(
      (a) =>
        a.attendedBy === caregiverName && (a.status === 'atendida' || a.status === 'falsa_alarma'),
    );
    return new Observable((obs) => obs.next(filtered));
  }

  resolveAlert(
    id: string,
    notes: string,
    status: 'atendida' | 'falsa_alarma',
    caregiverName: string,
    newSeverity: any,
  ) {
    // Si es mock, resolver local
    if (id.startsWith('mock-') || id.startsWith('alert-')) {
      const currentAlerts = this.alertsSubject.value;
      const index = currentAlerts.findIndex((a) => a.id === id);

      if (index !== -1) {
        const updatedAlerts = [...currentAlerts];
        updatedAlerts[index] = {
          ...updatedAlerts[index],
          status: status,
          resolutionNotes: notes,
          attendedBy: caregiverName,
          attendedAt: new Date(),
          severity: newSeverity,
          resolved: true,
        };
        this.alertsSubject.next(updatedAlerts);
      }
      return new Observable((obs) => {
        obs.next(true);
        obs.complete();
      });
    } else {
      // SI es real, llamar al backend
      // TODO: Implement resolve in ApiService and call from here
      // For now, simulate local execution to not break UI
      return new Observable((obs) => {
        obs.next(true);
        obs.complete();
      });
    }
  }
}
