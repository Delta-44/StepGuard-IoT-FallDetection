import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { 
  Shield, Users, AlertTriangle, Smartphone, Activity, Bell, CircleAlert,
  Settings, CircleUser, LogOut, MapPin, Radio, Clock, ClipboardList, 
  SquarePen, Trash2, Zap, ChartColumn, Heart, Mail, Phone, ChevronDown, ChevronUp,
  UserCircle, BarChart3
} from 'lucide-angular';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

const icons = {
  Shield, Users, AlertTriangle, Smartphone, Activity, Bell, CircleAlert,
  Settings, CircleUser, LogOut, MapPin, Radio, Clock, ClipboardList, 
  SquarePen, Trash2, Zap, ChartColumn, Heart, Mail, Phone, ChevronDown, ChevronUp,
  UserCircle, BarChart3
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(icons) }
  ]
};
