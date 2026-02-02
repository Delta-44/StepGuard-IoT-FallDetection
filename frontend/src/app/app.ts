import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div style="font-family: 'Segoe UI', sans-serif;">
      
      <nav style="background: #222; height: 60px; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
        
        <div style="display: flex; align-items: center; gap: 30px;">
          <div style="display: flex; align-items: center; gap: 8px; color: white; font-weight: bold; font-size: 1.2em;">
            🎯 StepGuard IoT
          </div>

          @if (currentUser()) {
            <div style="display: flex; gap: 20px;">
              <a routerLink="/home" routerLinkActive="active-link" class="nav-item">Inicio</a>

              <a routerLink="/dashboard" routerLinkActive="active-link" class="nav-item">Panel de Control</a>
              <a routerLink="/devices" routerLinkActive="active-link" class="nav-item">Dispositivos</a>
              
              @if (isAdmin()) {
                <a routerLink="/users" routerLinkActive="active-admin" class="nav-item-admin">👥 Usuarios</a>
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

            <button (click)="logout()" 
                    style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.85em;">
              Cerrar Sesión
            </button>
          </div>
        }

      </nav>

      <router-outlet></router-outlet>
      
    </div>
  `,
  styles: [`
    .nav-item { color: #aaa; text-decoration: none; font-weight: 500; transition: 0.3s; }
    .nav-item:hover { color: white; }
    .active-link { color: #00d2ff !important; font-weight: bold; }

    .nav-item-admin { color: #ff8888; text-decoration: none; border: 1px solid #ff8888; padding: 2px 8px; border-radius: 4px; font-size: 0.9em; }
    .nav-item-admin:hover { background: rgba(255,0,0,0.1); }
    .active-admin { background: #ff4444 !important; color: white !important; border-color: #ff4444; }
  `]
})
export class AppComponent {
  private authService = inject(AuthService);

  // Signals para controlar la vista
  public currentUser = this.authService.currentUser;
  public isAdmin = computed(() => this.currentUser()?.role === 'admin');

  logout() {
    this.authService.logout();
  }
}