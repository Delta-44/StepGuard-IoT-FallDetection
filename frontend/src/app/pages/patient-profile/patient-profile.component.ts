import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { AlertService } from '../../services/alert.service';
import { Alert } from '../../models/alert.model';
import { User } from '../../models/user.model';
import { Device } from '../../models/device';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service'; // 🆕
import { NotificationService } from '../../services/notification.service'; // 🆕

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.css'],
})
export class PatientProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private alertService = inject(AlertService);
  private userService = inject(UserService); // 🆕
  private notificationService = inject(NotificationService); // 🆕
  private router = inject(Router);

  public currentUser = signal<User | null>(null);
  public device = signal<Device | null>(null);
  public alerts = signal<Alert[]>([]);
  public isLoading = signal(true);

  // Estadísticas para las tarjetas
  public stats = {
    totalIncidents: 0,
    thisMonth: 0,
    resolved: 0,
    avgResponseTime: '5 min',
  };

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
      this.alertService.getAllAlerts().subscribe((allAlerts) => {
        const patientAlerts = allAlerts.filter(
          (alert: Alert) => alert.macAddress === patientData.dispositivo_mac,
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

    alerts.forEach((alert) => {
      const date = new Date(alert.timestamp).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)?.push(alert);
    });

    this.alertsByDate.set(grouped);

    // Calcular estadísticas
    this.stats.totalIncidents = alerts.length;
    this.stats.thisMonth = alerts.filter((a) => {
      const alertDate = new Date(a.timestamp);
      const now = new Date();
      return (
        alertDate.getMonth() === now.getMonth() && alertDate.getFullYear() === now.getFullYear()
      );
    }).length;
    this.stats.resolved = alerts.filter(
      (a) => a.status === 'atendida' || a.status === 'falsa_alarma',
    ).length;
  }

  getCriticalAlerts(): number {
    return this.alerts().filter((a) => a.severity === 'critical' || a.severity === 'high').length;
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return '#dc3545';
      case 'high':
        return '#ff6b6b';
      case 'medium':
        return '#ffa500';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  }

  getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'Crítica';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return 'Desconocida';
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'fall':
        return 'alert-triangle';
      case 'inactivity':
        return 'moon';
      case 'sos':
        return 'circle-alert';
      default:
        return 'bell';
    }
  }

  formatTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getDeviceStatusColor(): string {
    return this.device()?.estado ? '#28a745' : '#6c757d';
  }

  getDeviceStatusText(): string {
    return this.device()?.estado ? 'En línea' : 'Fuera de línea';
  }

  // Calendar methods
  getCurrentDay(): number {
    return new Date().getDate();
  }

  getCurrentMonth(): string {
    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    return months[new Date().getMonth()];
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  getCurrentDayName(): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[new Date().getDay()];
  }

  getCalendarDays(): number[] {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // First day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month, 1).getDay();

    // Total days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Create array with empty cells for days before the first day
    const calendar: number[] = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < firstDay; i++) {
      calendar.push(0);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(day);
    }

    // Ensure we have exactly 35 or 42 cells (5 or 6 weeks)
    const totalCells = calendar.length <= 35 ? 35 : 42;
    while (calendar.length < totalCells) {
      calendar.push(0);
    }

    return calendar;
  }

  exportData() {
    this.userService.exportUsersCSV().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mis_datos_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.notificationService.success('Éxito', 'Tus datos han sido descargados correctamente');
      },
      error: (err) => {
        console.error('Error exportando datos:', err);
        this.notificationService.error('Error', 'No se pudo descargar el archivo');
      }
    });
  }
}
