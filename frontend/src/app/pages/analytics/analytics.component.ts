import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
})
export class AnalyticsComponent implements OnInit {
  private authService = inject(AuthService);

  public currentUser = this.authService.currentUser;
  public dashboardUrl: string | null = null;
  public scopeLabel = computed(() => {
    const user = this.currentUser();
    if (!user) return 'Sin sesión';
    if (user.role === 'admin') return 'Vista completa (Admin)';
    if (user.role === 'caregiver') return 'Tus pacientes';
    return 'Tus métricas personales';
  });

  ngOnInit(): void {
    this.buildDashboardUrl();
  }

  private buildDashboardUrl() {
    const user = this.currentUser();
    if (!user) return;

    // ====================================================
    // GRAFANA CLOUD - DASHBOARD SNAPSHOT
    // ====================================================
    // Dashboard snapshot configurado en: https://delta44.grafana.net
    // ID del snapshot: XZNr2la0Fln0prRY6y9769ajsZLSUyUj
    // 
    // NOTA: Los snapshots son capturas estáticas del dashboard con los datos
    // actuales. No se actualizan en tiempo real ni aceptan variables dinámicas.
    // Todos los usuarios (admin, caregiver, patient) ven los mismos datos.
    // 
    // Para actualizar: crear nuevo snapshot en Grafana Cloud y reemplazar la URL.
    //
    // IMPORTANTE: Grafana Cloud bloquea iframes con X-Frame-Options: deny
    // Por eso abrimos el dashboard en una nueva pestaña.
    
    const snapshotUrl = 'https://delta44.grafana.net/dashboard/snapshot/XZNr2la0Fln0prRY6y9769ajsZLSUyUj';

    const params = new URLSearchParams();
    params.set('theme', 'dark');
    params.set('from', 'now-7d');
    params.set('to', 'now');

    // URL completa para abrir en nueva pestaña
    this.dashboardUrl = `${snapshotUrl}?${params.toString()}`;
  }

  public openDashboard() {
    if (this.dashboardUrl) {
      window.open(this.dashboardUrl, '_blank', 'noopener,noreferrer');
    }
  }
}
