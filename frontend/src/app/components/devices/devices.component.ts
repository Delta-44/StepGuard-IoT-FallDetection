import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Alert } from '../../models/alert.model';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.css'
})
export class DevicesComponent implements OnInit, OnDestroy {

  public alerts: Alert[] = [];
  public isCriticalState: boolean = false;
  public connectionStatus: string = 'Conectado';

  private sub: Subscription | undefined;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.sub = this.apiService.getAlertsStream().subscribe({
      next: (data: Alert[]) => {
        this.alerts = data;
        this.checkCriticality();
      },
      error: (err: any) => {
        this.connectionStatus = 'Error de conexión';
        console.error(err);
      }
    });
  }

  private checkCriticality(): void {
    this.isCriticalState = this.alerts.some(a => a.severity === 'critical' && !a.resolved);
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }
}
