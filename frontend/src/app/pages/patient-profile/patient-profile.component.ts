import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { AlertService, Alert } from '../../services/alert.service';
import { User } from '../../models/user.model';
import { Device } from '../../models/device';
import { Router } from '@angular/router';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.css']
})
export class PatientProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private alertService = inject(AlertService);
  private router = inject(Router);

  public currentUser = signal<User | null>(null);
  public device = signal<Device | null>(null);
  public alerts = signal<Alert[]>([]);
  public isLoading = signal(true);
  
  // Calendario - agrupado por fecha
  public alertsByDate = signal<Map<string, Alert[]>>(new Map());

  ngOnInit() {
    const user = this.authService.currentUser();
    
    // 🔒 Solo pacientes pueden ver esta página
    if (!user || user.role !== 'user') {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.currentUser.set(user);
    this.loadPatientData();
  }

  async loadPatientData() {
    this.isLoading.set(true);
    
    try {
      const userId = this.currentUser()?.id;
      if (!userId) return;

      // Cargar información completa del paciente
      const patientData = await this.apiService.getUserById(String(userId));
      this.currentUser.set(patientData);

      // Cargar dispositivo asignado
      if (patientData.dispositivo_mac) {
        const deviceData = await this.apiService.getDeviceByMac(patientData.dispositivo_mac);
        this.device.set(deviceData);
      }

      // Cargar alertas del paciente (convertir Observable a Promise)
      this.alertService.getAllAlerts().subscribe(allAlerts => {
        const patientAlerts = allAlerts.filter((alert: Alert) => 
          alert.macAddress === patientData.dispositivo_mac
        );
        
        this.alerts.set(patientAlerts);
        this.groupAlertsByDate(patientAlerts);
        this.isLoading.set(false);
      });
      
    } catch (error) {
      console.error('Error cargando datos del paciente:', error);
      this.isLoading.set(false);
    }
  }

  groupAlertsByDate(alerts: Alert[]) {
    const grouped = new Map<string, Alert[]>();
    
    alerts.forEach(alert => {
      const date = new Date(alert.timestamp).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)?.push(alert);
    });
    
    this.alertsByDate.set(grouped);
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#dc3545';
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffa500';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  }

  getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'critical': return 'Crítica';
      case 'high': return 'Alta';
      case 'medium': return 'Media';
      case 'low': return 'Baja';
      default: return 'Desconocida';
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'fall': return 'alert-triangle';
      case 'inactivity': return 'moon';
      case 'sos': return 'circle-alert';
      default: return 'bell';
    }
  }

  formatTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDeviceStatusColor(): string {
    return this.device()?.estado ? '#28a745' : '#6c757d';
  }

  getDeviceStatusText(): string {
    return this.device()?.estado ? 'En línea' : 'Fuera de línea';
  }
}
