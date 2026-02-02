import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Alert } from '../../models/alert.model';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service'; // <--- IMPORTANTE: Importar Auth
import { SeverityLabelPipe } from '../../pipes/severity-label-pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SeverityLabelPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // INYECCIONES
  private apiService = inject(ApiService);
  private authService = inject(AuthService); // <--- Inyectamos para saber quién eres

  // --- SIGNALS ---
  public alerts = signal<Alert[]>([]);
  public connectionStatus = signal<string>('Conectando...');

  // Calculamos si hay crisis
  public isCriticalState = computed(() => 
    this.alerts().some(a => a.severity === 'critical' && !a.resolved)
  );

  constructor() {
    this.apiService.getAlertsStream()
      .pipe(takeUntilDestroyed()) 
      .subscribe({
        next: (data) => {
          this.alerts.set(data);
          this.connectionStatus.set('Conectado');
        },
        error: (err) => {
          console.error(err);
          this.connectionStatus.set('Error de conexión');
        }
      });
  }

  ngOnInit(): void {}

  // --- ACCIÓN DE ATENDER ---
  public attendAlert(id: string): void {
    // 1. Obtenemos el usuario actual
    const currentUser = this.authService.currentUser();
    
    // Si por alguna razón no hay usuario, usamos un nombre genérico o paramos
    const userName = currentUser ? currentUser.fullName : 'Admin Desconocido';

    // 2. Llamamos a la API pasando el ID Y EL NOMBRE (Aquí estaba el error)
    this.apiService.markAsResolved(id, userName).subscribe(() => {
      
      // Actualizamos la señal localmente para ver el cambio instantáneo
      this.alerts.update(currentAlerts => 
        currentAlerts.map(alert => {
          if (alert.id === id) {
            return { 
              ...alert, 
              resolved: true, 
              assignedTo: userName // Guardamos el nombre visualmente
            };
          }
          return alert;
        })
      );

    });
  }
}