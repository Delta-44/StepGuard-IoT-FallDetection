import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DevicesComponent } from './components/devices/devices.component';

export const routes: Routes = [
  // 1. REGLA DE ORO: Si la ruta está vacía, redirige a 'dashboard'
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  
  // 2. La ruta principal - Dashboard
  { path: 'dashboard', component: DashboardComponent },
  
  // 3. La ruta de dispositivos - Vista de debug
  { path: 'devices', component: DevicesComponent }
];