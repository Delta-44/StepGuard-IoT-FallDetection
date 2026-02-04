import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AlertService, Alert } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service'; // 👈 IMPORTAR AUTH
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, DatePipe, LucideAngularModule],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
})
export class AlertsComponent implements OnInit {
  private alertService = inject(AlertService);
  private authService = inject(AuthService); // 👈 INYECTAR AUTH
  
  alerts: Alert[] = [];
  expandedAlerts = new Set<string>();

  // Título dinámico
  pageTitle = '🚨 Centro de Alertas Global';

  ngOnInit() {
    const user = this.authService.currentUser();
    if (!user) return;

    if (user.role === 'user') {
      // 👤 SI ES PACIENTE: Solo sus alertas
      this.pageTitle = '📅 Mi Historial de Alertas';
      // Usamos el ID del usuario para filtrar
      this.alertService.getAlertsByDeviceId(String(user.id)).subscribe(data => {
        this.alerts = data;
      });
    } else {
      // 👮 SI ES ADMIN/CUIDADOR: Todo
      this.pageTitle = '🚨 Centro de Alertas Global';
      this.alertService.getAllAlerts().subscribe(data => {
        this.alerts = data;
      });
    }
  }

  toggleNotes(id: string) {
    if (this.expandedAlerts.has(id)) {
      this.expandedAlerts.delete(id);
    } else {
      this.expandedAlerts.add(id);
    }
  }

  isExpanded(id: string): boolean {
    return this.expandedAlerts.has(id);
  }
}