import { Injectable } from '@angular/core';
import { of } from 'rxjs';

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  deviceId: string;
  location: string; // 👈 NUEVO CAMPO
  timestamp: Date;
  resolved: boolean;
  assignedTo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  // MOCK DATA ACTUALIZADO CON LUGARES
  private alerts: Alert[] = [
    { 
      id: 'a1', severity: 'critical', message: 'Caída detectada', 
      deviceId: '1', location: 'Baño Principal 🛁', // 👈 EJE
      timestamp: new Date('2024-02-10T08:30:00'), resolved: true, assignedTo: 'Enfermero Juan' 
    },
    { 
      id: 'a2', severity: 'warning', message: 'Pulsómetro desconectado', 
      deviceId: '1', location: 'Dormitorio 🛏️', 
      timestamp: new Date('2024-02-11T14:15:00'), resolved: false 
    },
    { 
      id: 'a3', severity: 'info', message: 'Dispositivo encendido', 
      deviceId: '2', location: 'Salón 📺', 
      timestamp: new Date('2024-02-12T09:00:00'), resolved: true 
    },
    { 
      id: 'a4', severity: 'critical', message: 'Botón SOS presionado', 
      deviceId: '2', location: 'Cocina 🍳', 
      timestamp: new Date('2024-02-12T10:45:00'), resolved: false 
    },
    { 
      id: 'a5', severity: 'warning', message: 'Batería baja (15%)', 
      deviceId: '3', location: 'Jardín 🌳', 
      timestamp: new Date('2024-02-13T18:20:00'), resolved: true 
    }
  ];

  getAllAlerts() {
    return of(this.alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  }

  getAlertsByDeviceId(deviceId: string) {
    const filtered = this.alerts.filter(a => a.deviceId === deviceId);
    return of(filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  }
}