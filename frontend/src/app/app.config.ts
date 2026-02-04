import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { 
  Shield, Users, AlertTriangle, Smartphone, Activity, Bell, CircleAlert, AlertCircle,
  Settings, CircleUser, LogOut, MapPin, Radio, Clock, ClipboardList, 
  SquarePen, Trash2, Zap, ChartColumn, Heart, Mail, Phone, ChevronDown, ChevronUp,
  LayoutDashboard, Battery, BatteryWarning, RefreshCw, MessageSquare, Calendar,
  User, Info, Braces, Terminal, Cpu, Wifi, Network, Thermometer, Siren,
  ArrowRight, ArrowUp, MoveVertical, BarChart3, CheckCircle, XCircle, X
} from 'lucide-angular';

import { routes } from './app.routes';

const icons = {
  Shield, Users, AlertTriangle, Smartphone, Activity, Bell, CircleAlert, AlertCircle,
  Settings, CircleUser, LogOut, MapPin, Radio, Clock, ClipboardList, 
  SquarePen, Trash2, Zap, ChartColumn, Heart, Mail, Phone, ChevronDown, ChevronUp,
  LayoutDashboard, Battery, BatteryWarning, RefreshCw, MessageSquare, Calendar,
  User, Info, Braces, Terminal, Cpu, Wifi, Network, Thermometer, Siren,
  ArrowRight, ArrowUp, MoveVertical, BarChart3, CheckCircle, XCircle, X
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(icons) }
  ]
};
