import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService, Alert } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
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
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  
  // Guardamos la suscripción para limpiarla al salir
  private alertSub: Subscription | null = null;
  private userSub: Subscription | null = null;

  today = new Date();
  // Inicializar con 0 hasta obtener datos reales
  stats = { activePatients: 0, pendingAlerts: 0, onlineDevices: 0, lowBattery: 0 };
  public activeAlerts: Alert[] = [];
  
  // 🆕 Estadísticas de alertas resueltas
  public resolvedStats = {
    totalResolved: 0,
    resolvedToday: 0,
    falseAlarms: 0,
    criticalResolved: 0,
    highResolved: 0,
    mediumResolved: 0,
    lowResolved: 0
  }; 

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
    
    // 🆕 Suscripción a usuarios para obtener datos reales
    this.userSub = this.userService.getAllUsers().subscribe(users => {
      const patients = users.filter(u => u.role === 'user');
      
      if (user?.role === 'user') {
        // Pacientes solo ven sus propios datos
        this.stats.activePatients = 1;
        this.stats.onlineDevices = 1; // Hardcodeado hasta implementar funcionalidad
      } else {
        // Admins y cuidadores ven todos los datos
        this.stats.activePatients = patients.length;
        this.stats.onlineDevices = 10; // Hardcodeado hasta implementar funcionalidad
      }
      this.cdr.markForCheck();
    });
    
    // Suscripción a alertas (carga asíncrona)
    this.alertSub = this.alertService.alerts$.subscribe(allAlerts => {
      
      let filteredAlerts = allAlerts;
      
      // Filtro de seguridad (Paciente ve solo lo suyo)
      if (user?.role === 'user') {
        filteredAlerts = allAlerts.filter(a => 
          a.userId === Number(user.id) || a.macAddress === String(user.dispositivo_mac)
        );
      }

      // Actualizar lista y stats en tiempo real
      this.activeAlerts = filteredAlerts.filter(a => a.status === 'pendiente');
      
      this.stats.pendingAlerts = this.activeAlerts.length;
      this.stats.lowBattery = filteredAlerts.filter(a => a.message.includes('Batería')).length;
      
      // 🆕 Calcular estadísticas de alertas resueltas
      const resolved = filteredAlerts.filter(a => a.status === 'atendida' || a.status === 'falsa_alarma');
      this.resolvedStats.totalResolved = resolved.length;
      this.resolvedStats.falseAlarms = filteredAlerts.filter(a => a.status === 'falsa_alarma').length;
      
      // Alertas resueltas hoy
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      this.resolvedStats.resolvedToday = resolved.filter(a => 
        new Date(a.attendedAt || a.timestamp) >= todayStart
      ).length;
      
      // Por severidad
      this.resolvedStats.criticalResolved = resolved.filter(a => a.severity === 'critical').length;
      this.resolvedStats.highResolved = resolved.filter(a => a.severity === 'high').length;
      this.resolvedStats.mediumResolved = resolved.filter(a => a.severity === 'medium').length;
      this.resolvedStats.lowResolved = resolved.filter(a => a.severity === 'low').length;
      
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
    if (this.userSub) this.userSub.unsubscribe();
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