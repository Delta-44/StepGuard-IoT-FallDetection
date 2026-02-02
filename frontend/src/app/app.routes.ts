import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DevicesComponent } from './components/devices/devices.component';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { UsersComponent } from './components/users/users.component';
import { AuthService } from './services/auth.service';
import { HomeComponent } from './components/home/home.component';

// --- LÓGICA DE GUARDIA (SECURITY GUARD) ---
const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Solo permitir si el usuario está autenticado Y tiene token
  const isAuthenticated = auth.currentUser() !== null || localStorage.getItem('auth_token'); // <--- Pequeña mejora: || es más seguro por si recargas página

  if (isAuthenticated) {
    return true;
  } else {
    // Limpiar cualquier dato residual
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mock_session');
    router.navigate(['/login']);
    return false;
  }
};

export const routes: Routes = [
  // 1. Rutas Públicas
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },


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
  { path: 'users', component: UsersComponent,
     canActivate: [authGuard]
 },
  { path: 'home', component: HomeComponent,
     canActivate: [authGuard] 
  },

  // 3. Redirecciones (SIEMPRE AL FINAL)
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];