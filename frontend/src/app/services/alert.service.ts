import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs'; // 👈 Añadido Subject

export interface Alert {
  id: string; 
  deviceId: string;
  userId?: number;
  acc_x?: number; acc_y?: number; acc_z?: number;
  severity: 'low' | 'medium' | 'high' | 'critical'; 
  status: 'pendiente' | 'atendida' | 'falsa_alarma' | 'ignorada';
  message: string;
  location: string;
  timestamp: Date;
  notes?: string;
  attendedBy?: string;
  attendedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  // MOCK DATA INICIAL
  private mockAlerts: Alert[] = [
    { 
      id: '201', severity: 'critical', status: 'pendiente',
      message: 'Caída detectada (Alto Impacto)', location: 'Dormitorio', 
      deviceId: 'Device-101', userId: 1, timestamp: new Date(), 
      acc_x: 2.5, acc_y: -0.1, acc_z: 0.3 
    }
  ];

  // ESTRUCTURA REACTIVA
  private alertsSubject = new BehaviorSubject<Alert[]>(this.mockAlerts);
  alerts$ = this.alertsSubject.asObservable();

  // 👇 NUEVO: Canal de Notificaciones para el Toast
  public alertNotification$ = new Subject<Alert>();

  public currentActiveAlert: Alert | null = null;

  constructor() {
    this.startSimulation();
  }

  // Genera una alerta aleatoria cada 15 segundos
  private startSimulation() {
    setInterval(() => {
      this.generateRandomAlert();
    }, 15000); 
  }

  private generateRandomAlert() {
    const locations = ['Baño', 'Cocina', 'Salón', 'Jardín', 'Dormitorio'];
    const messages = ['Caída detectada', 'Ritmo cardíaco alto', 'Batería baja', 'Inactividad'];
    const severities: Alert['severity'][] = ['low', 'medium', 'high', 'critical'];

    const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    
    // Solo generamos alerta crítica si es caída
    const finalSeverity = randomMsg.includes('Caída') ? 'critical' : randomSeverity;

    const newAlert: Alert = {
      id: Date.now().toString(),
      deviceId: `Device-${Math.floor(Math.random() * 5) + 1}`,
      userId: Math.floor(Math.random() * 3) + 1,
      severity: finalSeverity,
      status: 'pendiente',
      message: randomMsg,
      location: locations[Math.floor(Math.random() * locations.length)],
      timestamp: new Date(),
      acc_x: Math.random(),
      acc_y: Math.random(),
      acc_z: 9.8
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
    const filtered = current.filter(a => a.deviceId === id || (a.userId && String(a.userId) === id));
    return new Observable(obs => obs.next(filtered));
  }

  resolveAlert(id: string, notes: string, status: 'atendida' | 'falsa_alarma', caregiverName: string, newSeverity: any) {
    const currentAlerts = this.alertsSubject.value;
    const index = currentAlerts.findIndex(a => a.id === id);

    if (index !== -1) {
      const updatedAlerts = [...currentAlerts];
      updatedAlerts[index] = {
        ...updatedAlerts[index],
        status: status,
        notes: notes,
        attendedBy: caregiverName,
        attendedAt: new Date(),
        severity: newSeverity
      };
      this.alertsSubject.next(updatedAlerts);
    }
    return new Observable(obs => { obs.next(true); obs.complete(); });
  }
}