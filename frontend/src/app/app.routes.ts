import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DevicesComponent } from './components/devices/devices.component';
// import { LoginPage } ... YA NO LOS NECESITAMOS
// import { RegisterPage } ... YA NO LOS NECESITAMOS
import { UsersComponent } from './components/users/users.component';
import { AuthService } from './services/auth.service';
import { HomeComponent } from './components/home/home.component';
import { LandingComponent } from './pages/landing/landing.component';

// --- LÓGICA DE GUARDIA (SECURITY GUARD) ---
const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = auth.currentUser() !== null || localStorage.getItem('auth_token');

  if (isAuthenticated) {
    return true;
  } else {
    // Limpiar datos
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mock_session');
    
    // ⚠️ CAMBIO CLAVE: Si no tienes permiso, te mando a la PORTADA (Landing), no al Login antiguo.
    router.navigate(['/']); 
    return false;
  }
};

export const routes: Routes = [
  // ==========================================
  // 1. LA PUERTA DE ENTRADA (LANDING + MODALES)
  // ==========================================
  { path: '', component: LandingComponent }, 

  // ❌ HEMOS ELIMINADO LAS RUTAS 'login' y 'register' 
  // para que Angular no pueda navegar a esas páginas antiguas.

  // 2. Rutas Protegidas
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'devices',
    component: DevicesComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'users', 
    component: UsersComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'home', 
    component: HomeComponent,
    canActivate: [authGuard] 
  },

  // ==========================================
  // 3. RUTAS DESCONOCIDAS
  // ==========================================
  // Cualquier cosa rara -> A la portada
  { path: '**', redirectTo: '' } 
];