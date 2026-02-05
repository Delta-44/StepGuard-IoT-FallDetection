import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService, Alert } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, LucideAngularModule],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
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
      this.alertService.getAlertsByDeviceId(String(user.id)).subscribe(data => {
        console.log('Alertas cargadas (user):', data.length);
        this.alerts = data;
        this.applyFilters();
      });
    } else {
      this.pageTitle = 'Centro de Alertas Global';
      this.alertService.getAllAlerts().subscribe(data => {
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

  applyFilters() {
    console.log('applyFilters() - alerts.length:', this.alerts.length, 'statusFilter:', this.statusFilter);
    let filtered = [...this.alerts];
    
    // Filtrar por estado
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === this.statusFilter);
    }
    
    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(a => 
        a.message.toLowerCase().includes(term) ||
        a.location.toLowerCase().includes(term) ||
        a.macAddress.toLowerCase().includes(term) ||
        (a.notes && a.notes.toLowerCase().includes(term)) ||
        (a.attendedBy && a.attendedBy.toLowerCase().includes(term))
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

  // --- CONTADORES ---
  getAlertCountByStatus(status: 'pendiente' | 'atendida'): number {
    return this.alerts.filter(a => a.status === status).length;
  }
}