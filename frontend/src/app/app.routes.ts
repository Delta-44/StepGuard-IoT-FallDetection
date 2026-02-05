import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DevicesComponent } from './components/devices/devices.component';
import { UsersComponent } from './components/users/users.component';
import { AuthService } from './services/auth.service';
import { LandingComponent } from './pages/landing/landing.component';
import { AlertsComponent } from './components/alerts/alerts.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { PatientProfileComponent } from './pages/patient-profile/patient-profile.component';
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

  { path: 'alerts', component: AlertsComponent, canActivate: [authGuard] },

  // ==========================================
  // 3. PERFIL DE PACIENTE
  // ==========================================
  { path: 'profile', component: PatientProfileComponent, canActivate: [authGuard] },

  // ==========================================
  // 4. RESET PASSWORD (PÚBLICO)
  // ==========================================
  { path: 'reset-password', component: ResetPasswordComponent },

  // ==========================================
  // 5. RUTAS DESCONOCIDAS
  // ==========================================
  // Cualquier cosa rara -> A la portada
  { path: '**', redirectTo: '' } 
];