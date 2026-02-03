import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AlertService, Alert } from '../../services/alert.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="page-container">
      <h2>🚨 Centro de Alertas Global</h2>
      
      <div class="card">
        <table>
          <thead>
            <tr>
              <th>HORA</th>
              <th>SEVERIDAD</th>
              <th>MENSAJE</th>
              <th>LUGAR</th> <th>DISPOSITIVO</th>
              <th>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            @for (alert of alerts; track alert.id) {
              <tr [ngClass]="{'row-critical': alert.severity === 'critical' && !alert.resolved}">
                <td>{{ alert.timestamp | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>
                  <span class="badge" [ngClass]="alert.severity">
                    {{ alert.severity | uppercase }}
                  </span>
                </td>
                <td>{{ alert.message }}</td>
                
                <td style="font-weight: 500; color: #555;">📍 {{ alert.location }}</td>

                <td>Device-{{ alert.deviceId }}</td>
                <td>
                  <span class="status" [class.done]="alert.resolved">
                    {{ alert.resolved ? 'Resuelto' : 'Activo' }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; background: #f0f2f5; min-height: 100vh; }
    .card { background: white; padding: 1rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    table { width: 100%; border-collapse: collapse; font-family: sans-serif; }
    th { text-align: left; padding: 15px; border-bottom: 2px solid #eee; color: #666; }
    td { padding: 15px; border-bottom: 1px solid #eee; }
    
    /* Badges */
    .badge { padding: 5px 10px; border-radius: 4px; font-weight: bold; font-size: 0.75rem; color: white; }
    .badge.critical { background: #dc3545; }
    .badge.warning { background: #ffc107; color: #333; }
    .badge.info { background: #0d6efd; }

    /* Estado */
    .status { font-weight: bold; color: #dc3545; }
    .status.done { color: #198754; }

    /* Fila roja si es crítico y no resuelto */
    .row-critical { background-color: #fff0f0; }
  `]
})
export class AlertsComponent implements OnInit {
  private alertService = inject(AlertService);
  alerts: Alert[] = [];

  ngOnInit() {
    this.alertService.getAllAlerts().subscribe(data => this.alerts = data);
  }
}