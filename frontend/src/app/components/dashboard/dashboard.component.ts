import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService, Alert } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  private alertService = inject(AlertService);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  
  // Guardamos la suscripción para limpiarla al salir
  private alertSub: Subscription | null = null;

  today = new Date();
  // Inicializar con datos inmediatos para evitar delay
  stats = { activePatients: 12, pendingAlerts: 0, onlineDevices: 10, lowBattery: 0 };
  public activeAlerts: Alert[] = []; 

  // Variables Modal
  public processingAlert: Alert | null = null;
  public resolutionNotes: string = '';
  public selectedSeverity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  public isSubmitting = false;

  get canAttend() {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'caregiver';
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    
    // Mostrar datos inmediatamente ajustados al rol
    if (user?.role === 'user') {
      this.stats.activePatients = 1;
      this.stats.onlineDevices = 1;
    }
    
    // Suscripción a alertas (carga asíncrona)
    this.alertSub = this.alertService.alerts$.subscribe(allAlerts => {
      
      let filteredAlerts = allAlerts;
      
      // Filtro de seguridad (Paciente ve solo lo suyo)
      if (user?.role === 'user') {
        filteredAlerts = allAlerts.filter(a => 
          a.userId === Number(user.id) || a.deviceId === String(user.id)
        );
      }

      // Actualizar lista y stats en tiempo real
      this.activeAlerts = filteredAlerts.filter(a => a.status === 'pendiente');
      
      this.stats.pendingAlerts = this.activeAlerts.length;
      this.stats.activePatients = user?.role === 'user' ? 1 : 12;
      this.stats.onlineDevices = user?.role === 'user' ? 1 : 10;
      this.stats.lowBattery = filteredAlerts.filter(a => a.message.includes('Batería')).length;
      
      // Marcar para actualizar cambios en OnPush mode
      this.cdr.markForCheck();
    });

    // Manejo de redirección desde alerta roja
    if (this.alertService.currentActiveAlert && this.canAttend) {
      this.openResolutionModal(this.alertService.currentActiveAlert);
      this.alertService.currentActiveAlert = null; 
    }
  }

  ngOnDestroy() {
    // Evitar fugas de memoria
    if (this.alertSub) this.alertSub.unsubscribe();
  }

  // --- FUNCIONES DEL MODAL (Igual que antes) ---
  openResolutionModal(alert: Alert) {
    if (!this.canAttend) return;
    this.processingAlert = alert;
    this.resolutionNotes = ''; 
    this.selectedSeverity = alert.severity;
  }

  cancelResolution() { this.processingAlert = null; }

  trackAlertById(index: number, alert: Alert): string {
    return alert.id;
  }

  submitResolution(type: 'atendida' | 'falsa_alarma') {
    if (!this.processingAlert) return;
    this.isSubmitting = true;
    const caregiver = this.authService.currentUser()?.fullName || 'Desconocido';

    this.alertService.resolveAlert(
      this.processingAlert.id,
      this.resolutionNotes,
      type,
      caregiver,
      this.selectedSeverity
    ).subscribe(() => {
      this.isSubmitting = false;
      this.processingAlert = null;
      // No hace falta llamar a loadDashboardData(), la suscripción lo hace sola
    });
  }
}