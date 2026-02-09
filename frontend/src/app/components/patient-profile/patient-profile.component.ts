import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { Alert } from '../../models/alert.model';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.css'],
})
export class PatientProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private userService = inject(UserService);
  private apiService = inject(ApiService);
  private notificationService = inject(NotificationService);

  public currentUser = this.authService.currentUser;
  public myAlerts = signal<Alert[]>([]);
  public stats = {
    totalIncidents: 0,
    thisMonth: 0,
    resolved: 0,
    avgResponseTime: '5 min',
  };

  ngOnInit() {
    const user = this.currentUser();
    if (!user) return;

    // Cargar alertas SOLO si es paciente, o si es cuidador/admin quizás mostrar las asignadas?
    // Por ahora, para simplificar, mostramos alertas si el usuario tiene ID coincidente.
    // Si es admin/cuidador sin alertas propias, esto devolverá array vacío y no pasa nada.
    this.alertService.alerts$.subscribe((allAlerts) => {
      const userAlerts = allAlerts.filter(
        (a) => a.userId === Number(user.id) || a.deviceId === String(user.id),
      );

      this.myAlerts.set(userAlerts);

      // Calcular estadísticas
      this.stats.totalIncidents = userAlerts.length;
      this.stats.thisMonth = userAlerts.filter((a) => {
        const alertDate = new Date(a.timestamp);
        const now = new Date();
        return (
          alertDate.getMonth() === now.getMonth() && alertDate.getFullYear() === now.getFullYear()
        );
      }).length;
      this.stats.resolved = userAlerts.filter((a) => a.status !== 'pendiente').length;
    });
  }

  isUploading = signal(false);

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      if (!file.type.match(/image\/*/)) {
        this.notificationService.error('Error', 'Solo se permiten imágenes');
        return;
      }

      this.isUploading.set(true);
      const userId = Number(this.currentUser()?.id);

      this.apiService.uploadProfilePhoto(userId, file).subscribe({
        next: (response) => {
          this.isUploading.set(false);
          this.notificationService.success('Éxito', 'Foto de perfil actualizada');
          
          // Actualizar el usuario localmente
          const updatedUser = { ...this.currentUser()!, foto_perfil: response.photoUrl };
          this.authService.updateCurrentUser(updatedUser);
        },
        error: (err) => {
          console.error('Error uploading photo:', err);
          this.isUploading.set(false);
          this.notificationService.error('Error', 'No se pudo subir la foto');
        }
      });
    }
  }

  getSeverityColor(severity: string): string {
    const colors: any = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#ef4444',
    };
    return colors[severity] || '#6b7280';
  }

  getSeverityLabel(severity: string): string {
    const labels: any = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      critical: 'Crítica',
    };
    return labels[severity] || severity;
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      pendiente: 'Pendiente',
      atendida: 'Atendida',
      falsa_alarma: 'Falsa Alarma',
    };
    return labels[status] || status;
  }

  getMonthName(date: Date): string {
    const months = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    return months[new Date(date).getMonth()];
  }

  groupAlertsByMonth() {
    const grouped: { [key: string]: Alert[] } = {};

    this.myAlerts().forEach((alert) => {
      const date = new Date(alert.timestamp);
      const key = `${date.getFullYear()}-${date.getMonth()}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(alert);
    });

    return Object.entries(grouped)
      .map(([key, alerts]) => ({
        month: this.getMonthName(alerts[0].timestamp),
        year: new Date(alerts[0].timestamp).getFullYear(),
        alerts: alerts.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
      }))
      .sort((a, b) => b.year - a.year);
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
