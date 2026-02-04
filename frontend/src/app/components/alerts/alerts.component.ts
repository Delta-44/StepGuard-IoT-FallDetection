import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AlertService, Alert } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, DatePipe, LucideAngularModule],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertsComponent implements OnInit {
  private alertService = inject(AlertService);
  private authService = inject(AuthService);
  
  alerts: Alert[] = [];
  expandedAlerts = new Set<string>();

  pageTitle = 'Centro de Alertas Global';

  ngOnInit() {
    const user = this.authService.currentUser();
    if (!user) return;

    if (user.role === 'user') {
      this.pageTitle = 'Mi Historial de Alertas';
      this.alertService.getAlertsByDeviceId(String(user.id)).subscribe(data => {
        this.alerts = data;
      });
    } else {
      this.pageTitle = 'Centro de Alertas Global';
      this.alertService.getAllAlerts().subscribe(data => {
        this.alerts = data;
      });
    }
  }

  trackAlertById(index: number, alert: Alert): string {
    return alert.id;
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