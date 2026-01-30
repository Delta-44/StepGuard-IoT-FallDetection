import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
  { path: 'dashboard-component', component: DashboardComponent },
  { path: 'devices', component: DashboardComponent } // Temporal, luego crear DevicesComponent
];