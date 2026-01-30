import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common'; // Ya no es estrictamente necesario con @for, pero mal no hace
import { Alert } from '../../models/alert.model';
import { ApiService } from '../../services/api.service';
import { SeverityLabelPipe } from '../../pipes/severity-label-pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; // Para limpiar suscripciones auto

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SeverityLabelPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // INYECCIÓN DE DEPENDENCIAS (Más limpio que el constructor)
  private apiService = inject(ApiService);

  // --- ESTADO REACTIVO (SIGNALS) ---
  
  // 1. La lista de alertas es una Señal (empieza vacía)
  public alerts = signal<Alert[]>([]);

  // 2. El estado de conexión es otra señal
  public connectionStatus = signal<string>('Conectando...');

  // 3. ¡MAGIA! Esto se calcula AUTOMÁTICAMENTE. 
  // Si 'alerts' cambia, 'isCriticalState' se actualiza solo.
  public isCriticalState = computed(() => 
    this.alerts().some(a => a.severity === 'critical' && !a.resolved)
  );

  constructor() {
    // Configuramos la carga de datos al iniciar
    // takeUntilDestroyed() hace el trabajo sucio de ngOnDestroy por ti
    this.apiService.getAlertsStream()
      .pipe(takeUntilDestroyed()) 
      .subscribe({
        next: (data) => {
          this.alerts.set(data); // Actualizamos la señal
          this.connectionStatus.set('Conectado');
        },
        error: (err) => {
          console.error(err);
          this.connectionStatus.set('Error de conexión');
        }
      });
  }

  ngOnInit(): void {
    // Ya no necesitamos lógica aquí, está todo en el constructor reactivo
  }

  // ACCIONES
  public attendAlert(id: string): void {
    this.apiService.markAsResolved(id).subscribe(() => {
      // Actualizamos la señal localmente
      this.alerts.update(currentAlerts => 
        currentAlerts.map(alert => 
          alert.id === id ? { ...alert, resolved: true } : alert
        )
      );
      // Nota: No hace falta llamar a checkCriticality(), ¡computed lo hace solo!
    });
  }
}