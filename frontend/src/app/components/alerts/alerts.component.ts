import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../services/alert.service';
import { Alert } from '../../models/alert.model';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, LucideAngularModule],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css'],
})
export class AlertsComponent implements OnInit {
  private alertService = inject(AlertService);
  private authService = inject(AuthService);
  private cd = inject(ChangeDetectorRef);

  alerts: Alert[] = [];
  filteredAlerts: Alert[] = [];
  paginatedAlerts: Alert[] = [];
  expandedAlerts = new Set<string>();

  pageTitle = 'Centro de Alertas Global';

  // Variables de paginación
  currentPage = 1;
  pageSize = 3;
  totalPages = 1;

  // Variables de filtro y ordenamiento
  searchTerm: string = '';
  sortOrder: 'newest' | 'oldest' = 'newest';
  statusFilter: 'all' | 'pendiente' | 'atendida' = 'all';

  ngOnInit() {
    const user = this.authService.currentUser();
    if (!user) return;

    if (user.role === 'user') {
      this.pageTitle = 'Mi Historial de Alertas';
      this.alertService.getAlertsByDeviceId(String(user.id)).subscribe((data) => {
        console.log('Alertas cargadas (user):', data.length);
        this.alerts = data;
        this.applyFilters();
      });
    } else {
      this.pageTitle = 'Centro de Alertas Global';
      this.alertService.getAllAlerts().subscribe((data) => {
        console.log('Alertas cargadas (admin/caregiver):', data.length);
        this.alerts = data;
        this.applyFilters();
      });
    }
  }

  trackAlertById(index: number, alert: Alert): string {
    return alert.id;
  }

  toggleNotes(id: string) {
    if (this.expandedAlerts.has(id)) {
      this.expandedAlerts.delete(id);
    } else {
      this.expandedAlerts.add(id);
    }
    this.cd.detectChanges();
  }

  isExpanded(id: string): boolean {
    return this.expandedAlerts.has(id);
  }

  // --- MÉTODOS DE FILTRADO Y ORDENAMIENTO ---
  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'newest' ? 'oldest' : 'newest';
    this.applyFilters();
  }

  setStatusFilter(status: 'all' | 'pendiente' | 'atendida') {
    this.statusFilter = status;
    this.currentPage = 1;
    this.applyFilters();
  }

  // Método helper para normalizar texto (quitar tildes y minusculas)
  private normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  applyFilters() {
    console.log(
      'applyFilters() - alerts.length:',
      this.alerts.length,
      'statusFilter:',
      this.statusFilter,
    );
    let filtered = [...this.alerts];

    // Filtrar por estado
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status === this.statusFilter);
    }

    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.normalizeText(this.searchTerm);
      filtered = filtered.filter(
        (a) =>
          this.normalizeText(a.message).includes(term) ||
          this.normalizeText(a.location || '').includes(term) ||
          this.normalizeText(a.macAddress).includes(term) ||
          (a.resolutionNotes && this.normalizeText(a.resolutionNotes).includes(term)) ||
          (a.attendedBy && this.normalizeText(a.attendedBy).includes(term)),
      );
    }

    // Ordenar por fecha
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return this.sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    this.filteredAlerts = filtered;
    console.log('Después de filtrar - filteredAlerts.length:', this.filteredAlerts.length);
    this.updatePaginatedAlerts();
  }

  // --- MÉTODOS DE PAGINACIÓN ---
  updatePaginatedAlerts() {
    this.totalPages = Math.ceil(this.filteredAlerts.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedAlerts = this.filteredAlerts.slice(startIndex, endIndex);
    console.log('updatePaginatedAlerts() - paginatedAlerts.length:', this.paginatedAlerts.length);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedAlerts();
      this.cd.detectChanges();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedAlerts();
      this.cd.detectChanges();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedAlerts();
      this.cd.detectChanges();
    }
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Variables Modal
  public processingAlert: Alert | null = null;
  public resolutionNotes: string = '';
  public selectedSeverity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  public isSubmitting = false;

  get canAttend() {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'caregiver';
  }

  // --- FUNCIONES DEL MODAL ---
  openResolutionModal(alert: Alert) {
    if (!this.canAttend) return;
    this.processingAlert = alert;
    this.resolutionNotes = '';
    this.selectedSeverity = alert.severity as any;
  }

  cancelResolution() {
    this.processingAlert = null;
  }

  submitResolution(type: 'atendida' | 'falsa_alarma') {
    if (!this.processingAlert) return;
    this.isSubmitting = true;
    const currentUser = this.authService.currentUser();
    const caregiver = currentUser?.fullName || currentUser?.username || 'Desconocido';

    this.alertService
      .resolveAlert(
        this.processingAlert.id,
        this.resolutionNotes,
        type,
        caregiver,
        this.selectedSeverity,
      )
      .subscribe(() => {
        this.isSubmitting = false;
        
        // Optimistic Update: Actualizar estado local sin recargar todo
        const index = this.alerts.findIndex(a => a.id === this.processingAlert?.id);
        if (index !== -1) {
            this.alerts[index] = {
                ...this.alerts[index],
                status: type,
                resolutionNotes: this.resolutionNotes,
                attendedBy: caregiver,
                attendedAt: new Date(),
                severity: this.selectedSeverity,
                resolved: true
            };
            // Re-aplicar filtros para actualizar la vista (paginación, orden, etc)
            this.applyFilters();
        }

        this.processingAlert = null;
      });
  }

  // --- PAGINACIÓN RESPONSIVE ---
  get visiblePages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2; // Cantidad de páginas a mostrar a cada lado de la actual
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= total; i++) {
        // Mostrar primera, última, actual y vecinas
        if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
            range.push(i);
        }
    }

    for (const i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l !== 1) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i;
    }

    return rangeWithDots;
  }

  // --- CONTADORES ---
  getAlertCountByStatus(status: 'pendiente' | 'atendida'): number {
    return this.alerts.filter((a) => a.status === status).length;
  }
}
