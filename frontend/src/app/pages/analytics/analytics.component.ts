import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
})
export class AnalyticsComponent implements OnInit {
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  public currentUser = this.authService.currentUser;
  public safeUrl: SafeResourceUrl | null = null;
  public scopeLabel = computed(() => {
    const user = this.currentUser();
    if (!user) return 'Sin sesión';
    if (user.role === 'admin') return 'Vista completa (Admin)';
    if (user.role === 'caregiver') return 'Tus pacientes';
    return 'Tus métricas personales';
  });

  ngOnInit(): void {
    this.buildEmbedUrl();
  }

  private buildEmbedUrl() {
    const user = this.currentUser();
    if (!user) return;

    // Dashboard UID actualizado
    const dashboardUid = 'stepguard-general-v2';
    const base = environment.grafanaUrl || 'http://localhost:3001';

    const params = new URLSearchParams();
    params.set('orgId', '1');
    params.set('kiosk', ''); // Modo kiosk limpio
    params.set('theme', 'dark');
    params.set('from', 'now-7d');
    params.set('to', 'now');

    // Variables por defecto
    let varUserId = '0';
    let varCaregiverId = '0';
    let varScope = 'null';

    // Filtrado según rol
    if (user.role === 'admin') {
      varScope = 'all';
    } else if (user.role === 'caregiver') {
      varCaregiverId = String(user.id);
    } else if (user.role === 'user') {
      varUserId = String(user.id);
    }

    // Pasar todas las variables
    params.set('var-varUserId', varUserId);
    params.set('var-varCaregiverId', varCaregiverId);
    params.set('var-varScope', varScope);

    const fullUrl = `${base}/d/${dashboardUid}?${params.toString()}`;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
  }
}
