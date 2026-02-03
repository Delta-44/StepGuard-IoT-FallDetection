import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';
import { Alert } from './models/alert.model';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  styleUrl: './app.css',
  template: `
    <div style="font-family: 'Segoe UI', sans-serif;">
      
      @if (criticalAlert()) {
        <div class="emergency-overlay">
          <div class="emergency-box">
            <div class="siren-icon">🚨</div>
            <h1>¡EMERGENCIA DETECTADA!</h1>

            <div class="alert-details">
              <p><strong>Dispositivo:</strong> {{ criticalAlert()?.deviceId }}</p>
              <p><strong>Mensaje:</strong> {{ criticalAlert()?.message }}</p>
              <p><strong>Hora:</strong> {{ criticalAlert()?.timestamp | date: 'mediumTime' }}</p>
            </div>

            <button (click)="goToDashboard()" class="btn-emergency">VER Y ATENDER AHORA</button>
          </div>
        </div>
      }

      @if (showNavbar()) {
        <nav style="background: #222; height: 60px; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 5px rgba(0,0,0,0.2); position: relative; z-index: 10;">
          
          <a routerLink="/" style="text-decoration: none; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 8px; color: white; font-weight: bold; font-size: 1.2em;">
              🎯 StepGuard IoT
            </div>
          </a>

          @if (currentUser()) {
            <div style="display: flex; gap: 20px;">
              <a routerLink="/dashboard" routerLinkActive="active-link" class="nav-item">🩺 Monitorización</a>
              <a routerLink="/devices" routerLinkActive="active-link" class="nav-item">📱 Dispositivos</a>

              @if (currentUser()?.role === 'admin' || currentUser()?.role === 'caregiver') {
                <a
                  routerLink="/users"
                  routerLinkActive="active-link"
                  [class.nav-item-admin]="isAdmin()"
                  [class.nav-item]="!isAdmin()"
                >
                  👥 {{ isAdmin() ? 'Gestión Usuarios' : 'Lista Pacientes' }}
                </a>
              }
            </div>
          }

          <div style="display: flex; align-items: center; gap: 15px;">
            
            @if (currentUser()) {
              <div style="text-align: right; color: white; line-height: 1.2;">
                <div style="font-weight: bold; font-size: 0.9em;">{{ currentUser()?.fullName }}</div>
                <div style="font-size: 0.75em; opacity: 0.8; color: #ccc;">
                  @switch (currentUser()?.role) {
                    @case ('admin') { 🔒 Administrador }
                    @case ('caregiver') { 🏥 Cuidador }
                    @case ('user') { 👤 Paciente }
                  }
                </div>
              </div>
              <button
                (click)="logout()"
                style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;"
              >
                Salir
              </button>
            } 
            
            @else {
              <a routerLink="/login" style="color: white; text-decoration: none; font-weight: 500; font-size: 0.9rem; margin-right: 10px; cursor: pointer;">
                Iniciar Sesión
              </a>
              <a routerLink="/register" style="background: #007bff; color: white; text-decoration: none; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; transition: background 0.3s; cursor: pointer;">
                Registrarse
              </a>
            }

          </div>
        </nav>
      }

      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  public router = inject(Router);

  public currentUser = this.authService.currentUser;
  public isAdmin = computed(() => this.currentUser()?.role === 'admin');

  public criticalAlert = signal<Alert | null>(null);

  // Control de la Barra de Navegación
  public showNavbar = signal<boolean>(true);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Ocultamos la barra global en: Portada, Login y Registro
      const isLandingOrAuth = event.url === '/' || event.url.includes('/login') || event.url.includes('/register');
      this.showNavbar.set(!isLandingOrAuth);
    });
  }

  ngOnInit() {
    this.apiService.getAlertsStream().subscribe(alerts => {

      if (!this.currentUser()) {
        this.criticalAlert.set(null);
        return;
      }

      if (this.currentUser()?.role === 'user') {
        this.criticalAlert.set(null);
        return;
      }

      const currentUrl = this.router.url;
      if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
        this.criticalAlert.set(null);
        return;
      }

      if (currentUrl.includes('/dashboard')) {
        this.criticalAlert.set(null);
        return;
      }

      const emergency = alerts.find(a => a.severity === 'critical' && !a.resolved);
      this.criticalAlert.set(emergency || null);
    });
  }

  logout() {
    this.authService.logout();
    this.criticalAlert.set(null);
  }

  goToDashboard() {
    this.criticalAlert.set(null);
    this.router.navigate(['/dashboard']);
  }
}