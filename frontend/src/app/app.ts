import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service'; // <--- Importamos ApiService
import { Alert } from './models/alert.model';
import { CommonModule } from '@angular/common'; // Necesario para estilos dinámicos

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
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

      <nav
        style="background: #222; height: 60px; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 5px rgba(0,0,0,0.2); position: relative; z-index: 10;"
      >
        <div style="display: flex; align-items: center; gap: 30px;">
          <div
            style="display: flex; align-items: center; gap: 8px; color: white; font-weight: bold; font-size: 1.2em;"
          >
            🎯 StepGuard IoT
          </div>

          @if (currentUser()) {
            <div style="display: flex; gap: 20px;">
              <a routerLink="/home" routerLinkActive="active-link" class="nav-item">🏠 Inicio</a>
              <a routerLink="/dashboard" routerLinkActive="active-link" class="nav-item"
                >🩺 Monitorización</a
              >
              <a routerLink="/devices" routerLinkActive="active-link" class="nav-item"
                >📱 Dispositivos</a
              >

              @if (isAdmin()) {
                <a
                  routerLink="/users"
                  [class.nav-item-admin]="isAdmin()"
                  [class.nav-item]="!isAdmin()"
                  routerLinkActive="active-link"
                >
                  👥 {{ isAdmin() ? 'Gestión Usuarios' : 'Lista Pacientes' }}
                </a>
              }
            </div>
          }
        </div>

        @if (currentUser()) {
          <div style="display: flex; align-items: center; gap: 15px;">
            <div style="text-align: right; color: white; line-height: 1.2;">
              <div style="font-weight: bold; font-size: 0.9em;">{{ currentUser()?.fullName }}</div>
              <div style="font-size: 0.75em; opacity: 0.8; color: #ccc;">
                {{ isAdmin() ? '🔒 Administrador' : '🩺 Cuidador' }}
              </div>
            </div>
            <button
              (click)="logout()"
              style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;"
            >
              Salir
            </button>
          </div>
        }
      </nav>

      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      .nav-item {
        color: #aaa;
        text-decoration: none;
        font-weight: 500;
        transition: 0.3s;
      }
      .nav-item:hover {
        color: white;
      }
      .active-link {
        color: #00d2ff !important;
        font-weight: bold;
      }
      .nav-item-admin {
        color: #ff8888;
        text-decoration: none;
        border: 1px solid #ff8888;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.9em;
      }
      .active-admin {
        background: #ff4444 !important;
        color: white !important;
        border-color: #ff4444;
      }

      /* --- ESTILOS DE LA ALERTA GLOBAL --- */
      .emergency-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(255, 0, 0, 0.85); /* ROJO SEMITRANSPARENTE */
        z-index: 9999; /* Por encima de TODO */
        display: flex;
        justify-content: center;
        align-items: center;
        animation: pulseBackground 2s infinite;
        backdrop-filter: blur(5px);
      }

      .emergency-box {
        background: white;
        padding: 40px;
        border-radius: 20px;
        text-align: center;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 5px solid #dc3545;
      }

      .siren-icon {
        font-size: 80px;
        animation: bounce 1s infinite;
        margin-bottom: 20px;
      }

      .emergency-box h1 {
        color: #dc3545;
        margin: 0 0 20px 0;
        font-size: 2em;
        letter-spacing: -1px;
      }

      .alert-details {
        background: #fff0f0;
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 25px;
        text-align: left;
        border: 1px solid #ffcccc;
      }
      .alert-details p {
        margin: 5px 0;
        color: #555;
        font-size: 1.1em;
      }

      .btn-emergency {
        background: #dc3545;
        color: white;
        border: none;
        padding: 15px 30px;
        font-size: 1.2em;
        font-weight: bold;
        border-radius: 50px;
        cursor: pointer;
        box-shadow: 0 5px 15px rgba(220, 53, 69, 0.4);
        transition: transform 0.2s;
      }
      .btn-emergency:hover {
        transform: scale(1.05);
        background: #c82333;
      }

      @keyframes bounce {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }
      @keyframes pulseBackground {
        0% {
          background: rgba(220, 53, 69, 0.8);
        }
        50% {
          background: rgba(180, 0, 0, 0.9);
        }
        100% {
          background: rgba(220, 53, 69, 0.8);
        }
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);

  // Signals
  public currentUser = this.authService.currentUser;
  public isAdmin = computed(() => this.currentUser()?.role === 'admin');

  // ALERTA CRÍTICA ACTIVA (Signal)
  public criticalAlert = signal<Alert | null>(null);

  ngOnInit() {
    this.apiService.getAlertsStream().subscribe(alerts => {
      
      // 🔒 PROTECCIÓN 1: Si no hay usuario logueado, NO hacemos nada
      if (!this.currentUser()) {
        this.criticalAlert.set(null); // Aseguramos que se quite si estaba
        return;
      }

      // 🔒 PROTECCIÓN 2: Si estamos en páginas públicas, NO molestamos
      const currentUrl = this.router.url;
      if (currentUrl.includes('/login') || currentUrl.includes('/register')) {
        this.criticalAlert.set(null);
        return;
      }

      // 🔒 PROTECCIÓN 3: Si ya estás en el Dashboard, no bloqueamos la pantalla
      if (currentUrl.includes('/dashboard')) {
        this.criticalAlert.set(null); 
        return; 
      }

      // --- Si pasamos los filtros, ahora sí buscamos emergencias ---
      const emergency = alerts.find(a => a.severity === 'critical' && !a.resolved);
      
      this.criticalAlert.set(emergency || null);
    });
  }

  logout() {
    this.authService.logout();
    this.criticalAlert.set(null); // Limpiar alerta al salir
  }

  goToDashboard() {
    // 1. Quitamos la alerta visualmente YA
    this.criticalAlert.set(null);

    // 2. Nos vamos al dashboard
    this.router.navigate(['/dashboard']);
  }
}
