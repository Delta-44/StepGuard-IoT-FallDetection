import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Alert } from '../../models/alert.model';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SeverityLabelPipe } from '../../pipes/severity-label-pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SeverityLabelPipe], // Importamos tu Pipe y módulos comunes
  templateUrl: './dashboard.component.html', 
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {

  // --- VARIABLES PÚBLICAS PARA EL DISEÑADOR ---
  public alerts: Alert[] = [];
  public isCriticalState: boolean = false; // Úsalo para activar alarmas globales
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

  // Lógica para el botón "Atender"
  public attendAlert(id: string): void {
    this.apiService.markAsResolved(id).subscribe(() => {
      // Actualizamos la lista localmente para que la UI responda rápido
      const found = this.alerts.find(a => a.id === id);
      if (found) found.resolved = true;
      this.checkCriticality();
    });
  }

  // Lógica interna para determinar si encendemos la luz roja
  private checkCriticality(): void {
    // Si hay al menos una crítica NO resuelta -> ESTADO CRÍTICO
    this.isCriticalState = this.alerts.some(a => a.severity === 'critical' && !a.resolved);
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe(); // Limpieza de memoria
  }
}
