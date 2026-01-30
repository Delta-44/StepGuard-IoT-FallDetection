import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DevicesComponent } from './components/devices/devices.component';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { AuthService } from './services/auth.service';

// --- LÓGICA DE GUARDIA (SECURITY GUARD) ---
const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Solo permitir si el usuario está autenticado Y tiene token
  const isAuthenticated = auth.currentUser() !== null && localStorage.getItem('auth_token');
  
  if (isAuthenticated) {
    return true; // Permitir acceso
  } else {
    // Limpiar cualquier dato residual
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mock_session');
    router.navigate(['/login']); // Redirigir a login
    return false;
  }
};

export const routes: Routes = [
  // Rutas Públicas
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Rutas Protegidas (Requieren Login)
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

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  { path: '**', redirectTo: 'login' }
];