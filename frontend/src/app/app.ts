import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';
import { Alert } from './services/alert.service'; // Asegúrate de importar Alert desde donde esté tu interfaz
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  styleUrl: './app.css', // Asegúrate de que este archivo exista
  templateUrl: './app.html' // 👈 AHORA USAMOS EL ARCHIVO EXTERNO
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService); // O AlertService si lo cambiaste
  public router = inject(Router);

  public currentUser = this.authService.currentUser;
  public isAdmin = computed(() => this.currentUser()?.role === 'admin');

  public criticalAlert = signal<Alert | null>(null);
  public showNavbar = signal<boolean>(true);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Ocultar navbar en la portada
      const isLanding = event.url === '/';
      this.showNavbar.set(!isLanding);
    });
  }

  ngOnInit() {
    // Si usas ApiService o AlertService, asegúrate de llamar al método correcto
    // Aquí asumo que tienes un método getAlertsStream o similar
    // Si no, puedes usar el AlertService que creamos antes con un polling simple o mock.
    
    // EJEMPLO CON TU LÓGICA ANTERIOR DE ALERTAS
    /* this.apiService.getAlertsStream().subscribe(alerts => {
      if (!this.currentUser() || this.currentUser()?.role === 'user') {
        this.criticalAlert.set(null);
        return;
      }
      
      const emergency = alerts.find(a => a.severity === 'critical' && !a.resolved);
      this.criticalAlert.set(emergency || null);
    });
    */
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