import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AlertService, Alert } from '../../services/alert.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.css']
})
export class PatientProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  public currentUser = this.authService.currentUser;
  public myAlerts = signal<Alert[]>([]);
  public stats = {
    totalIncidents: 0,
    thisMonth: 0,
    resolved: 0,
    avgResponseTime: '5 min'
  };

  ngOnInit() {
    const user = this.currentUser();
    if (!user) return;

    // Cargar alertas del paciente
    this.alertService.alerts$.subscribe(allAlerts => {
      const userAlerts = allAlerts.filter(a => 
        a.userId === Number(user.id) || a.deviceId === String(user.id)
      );
      
      this.myAlerts.set(userAlerts);
      
      // Calcular estadísticas
      this.stats.totalIncidents = userAlerts.length;
      this.stats.thisMonth = userAlerts.filter(a => {
        const alertDate = new Date(a.timestamp);
        const now = new Date();
        return alertDate.getMonth() === now.getMonth() && 
               alertDate.getFullYear() === now.getFullYear();
      }).length;
      this.stats.resolved = userAlerts.filter(a => a.status !== 'pendiente').length;
    });
  }

  getSeverityColor(severity: string): string {
    const colors: any = {
      'low': '#10b981',
      'medium': '#f59e0b',
      'high': '#f97316',
      'critical': '#ef4444'
    };
    return colors[severity] || '#6b7280';
  }

  getSeverityLabel(severity: string): string {
    const labels: any = {
      'low': 'Baja',
      'medium': 'Media',
      'high': 'Alta',
      'critical': 'Crítica'
    };
    return labels[severity] || severity;
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      'pendiente': 'Pendiente',
      'atendida': 'Atendida',
      'falsa_alarma': 'Falsa Alarma'
    };
    return labels[status] || status;
  }

  getMonthName(date: Date): string {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[new Date(date).getMonth()];
  }

  groupAlertsByMonth() {
    const grouped: { [key: string]: Alert[] } = {};
    
    this.myAlerts().forEach(alert => {
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
        alerts: alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }))
      .sort((a, b) => b.year - a.year);
  }
}
