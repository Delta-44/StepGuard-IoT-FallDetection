import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AlertService } from './services/alert.service';
import { Alert } from './models/alert.model';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs'; // 👈 Importante
import { LucideAngularModule } from 'lucide-angular';
import { NotificationComponent } from './components/notification/notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    LucideAngularModule,
    NotificationComponent,
  ],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class AppComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService); // Público para usar en HTML
  private alertService = inject(AlertService);
  public router = inject(Router);

  public currentUser = this.authService.currentUser;
  public isAdmin = computed(() => this.currentUser()?.role === 'admin');

  // Alerta Roja (Crítica)
  public criticalAlert = signal<Alert | null>(null);

  // 👇 Alerta Mini (Toast)
  public miniAlert = signal<Alert | null>(null);
  private miniAlertTimeout: any;

  public showNavbar = signal<boolean>(true);
  private alertSub: Subscription | null = null;
  private routerSub: Subscription | null = null;

  ngOnInit() {
    // Suscripción a navegación
    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const isLanding = event.url === '/';
        this.showNavbar.set(!isLanding);

        // Limpiar alertas cuando estás en landing
        if (isLanding) {
          this.criticalAlert.set(null);
          this.miniAlert.set(null);
        }
      });

    // Suscripción a alertas
    this.alertSub = this.alertService.alertNotification$.subscribe((newAlert) => {
      this.handleNewAlert(newAlert);
    });
  }

  handleNewAlert(alert: Alert) {
    const user = this.currentUser();

    // 🔒 SEGURIDAD: Si no hay usuario o es PACIENTE, no mostramos nada
    if (!user || user.role === 'user') return;

    // Si es CRÍTICA, dejamos que salte el Overlay Rojo (opcional) o mostramos ambas
    if (alert.severity === 'critical') {
      this.criticalAlert.set(alert);
      return;
    }

    // Si es ALTA/MEDIA/BAJA -> Mini Notificación
    this.showMiniNotification(alert);
  }

  showMiniNotification(alert: Alert) {
    this.miniAlert.set(alert);

    // Ocultar a los 6 segundos
    if (this.miniAlertTimeout) clearTimeout(this.miniAlertTimeout);
    this.miniAlertTimeout = setTimeout(() => {
      this.closeMiniAlert();
    }, 6000);
  }

  closeMiniAlert() {
    this.miniAlert.set(null);
  }

  // Ir al dashboard desde la Alerta Roja
  goToDashboard() {
    if (this.criticalAlert()) {
      this.alertService.currentActiveAlert = this.criticalAlert();
      this.criticalAlert.set(null);
      this.router.navigate(['/dashboard']);
    }
  }

  // Ir al dashboard desde la Mini Alerta
  goToDashboardFromMini() {
    const alert = this.miniAlert();
    if (alert) {
      this.alertService.currentActiveAlert = alert;
      this.miniAlert.set(null);
      this.router.navigate(['/dashboard']);
    }
  }

  logout() {
    this.authService.logout();
    this.criticalAlert.set(null);
    this.miniAlert.set(null);
  }

  ngOnDestroy() {
    if (this.alertSub) this.alertSub.unsubscribe();
    if (this.routerSub) this.routerSub.unsubscribe();
  }
}
