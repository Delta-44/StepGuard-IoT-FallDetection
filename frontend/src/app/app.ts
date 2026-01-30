import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  protected auth = inject(AuthService);
  protected router = inject(Router);
  protected showNavbar = signal(false);

  constructor() {
    // Detectar cambios de ruta para mostrar/ocultar navbar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const publicRoutes = ['/login', '/register'];
      this.showNavbar.set(!publicRoutes.includes(event.url));
    });
  }

  logout() {
    this.auth.logout();
  }
}
