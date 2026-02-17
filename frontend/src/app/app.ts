import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { AlertService } from './services/alert.service';
import { Alert } from './models/alert.model';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs'; // 👈 Importante
import { LucideAngularModule } from 'lucide-angular';
import { NotificationComponent } from './components/notification/notification.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';

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
    ChatbotComponent,
  ],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class AppComponent implements OnInit, OnDestroy {
  public authService = inject(AuthService); // Público para usar en HTML
  public themeService = inject(ThemeService); // 👈 Inject ThemeService
  private alertService = inject(AlertService);
  public router = inject(Router);

  public currentUser = this.authService.currentUser;
  public isAdmin = computed(() => this.currentUser()?.role === 'admin');
  public canViewAnalytics = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'admin' || role === 'caregiver';
  });

  // Alerta Roja (Crítica)
  public criticalAlert = signal<Alert | null>(null);

  // 👇 Alerta Mini (Toast)
  public miniAlert = signal<Alert | null>(null);
  private miniAlertTimeout: any;

  public showNavbar = signal<boolean>(true);
  public isMobileMenuOpen = signal<boolean>(false); // 👈 Estado del menú móvil
  public isProfileDropdownOpen = signal<boolean>(false); // 👈 Estado del dropdown de perfil
  private alertSub: Subscription | null = null;
  private routerSub: Subscription | null = null;

  toggleMenu() {
    this.isMobileMenuOpen.update(value => !value);
  }

  closeMenu() {
    this.isMobileMenuOpen.set(false);
  }

  toggleProfileDropdown() {
    this.isProfileDropdownOpen.update(value => !value);
  }

  closeProfileDropdown() {
    this.isProfileDropdownOpen.set(false);
  }

  ngOnInit() {
    // Suscripción a navegación
    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const isLanding = event.url === '/';
        this.showNavbar.set(!isLanding);
        this.closeMenu(); // 👈 Cerrar menú móvil al navegar
        this.closeProfileDropdown(); // 👈 Cerrar dropdown perfil al navegar

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

    // 🛑 NUEVO: Si estamos en la landing page ('/'), NO mostrar alertas
    if (this.router.url === '/') {
      console.log('🔇 Alerta ignorada en landing page');
      return;
    }

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

  // Abrir Grafana Dashboard en nueva pestaña
  openGrafanaDashboard() {
    const snapshotUrl = 'https://delta44.grafana.net/dashboard/snapshot/XZNr2la0Fln0prRY6y9769ajsZLSUyUj';
    const params = new URLSearchParams();
    params.set('theme', 'dark');
    params.set('from', 'now-7d');
    params.set('to', 'now');
    const fullUrl = `${snapshotUrl}?${params.toString()}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  }

  logout() {
    this.authService.logout();
    this.alertService.stopService(); // 👈 Detener alertas
    this.criticalAlert.set(null);
    this.miniAlert.set(null);
  }

  ngOnDestroy() {
    if (this.alertSub) this.alertSub.unsubscribe();
    if (this.routerSub) this.routerSub.unsubscribe();
  }
}
