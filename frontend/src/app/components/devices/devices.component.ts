import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Device } from '../../models/device';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevicesComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  public devices = signal<Device[]>([]);
  public filteredDevices = signal<Device[]>([]);
  public paginatedDevices = signal<Device[]>([]);
  public isLoading = signal<boolean>(true);
  public showTechnicalPanel = signal<boolean>(false);
  public connectionStatus = signal<'Conectado' | 'Desconectado'>('Conectado');
  public criticalState = signal<boolean>(false);

  // Búsqueda
  public searchTerm = signal<string>('');

  // Filtro de estado
  public statusFilter = signal<'all' | 'online' | 'offline'>('all');

  // Variables de paginación
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(6);
  public totalPages = signal<number>(1);

  // Variables Modal Edición
  public isEditModalOpen = signal<boolean>(false);
  public selectedDevice = signal<Device | null>(null);
  public editedDeviceName = signal<string>('');

  // Polling para actualización automática
  private pollingInterval: any;

  public isAdmin = computed(() => this.authService.currentUser()?.role === 'admin');
  public canViewTechnical = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'caregiver';
  });

  ngOnInit(): void {
    this.loadDevices();

    // Actualizar datos cada 5 segundos para obtener datos del ESP32 en tiempo real
    this.pollingInterval = setInterval(() => {
      this.loadDevices();
    }, 5000);
  }

  ngOnDestroy(): void {
    // Limpiar el intervalo cuando se destruya el componente
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  trackDeviceById(index: number, device: Device): string {
    return device.mac_address || index.toString();
  }

  public loadDevices(): void {
    this.isLoading.set(true);
    this.connectionStatus.set('Conectado');
    this.apiService.getDevices().subscribe({
      next: (data) => {
        this.devices.set(data);
        const hasCritical = data.some((d) => d.esp32Data?.isFallDetected || !d.estado);
        this.criticalState.set(hasCritical);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando dispositivos:', err);
        this.connectionStatus.set('Desconectado');
        this.isLoading.set(false);
      },
    });
  }

  public toggleTechnicalPanel(): void {
    this.showTechnicalPanel.set(!this.showTechnicalPanel());
  }

  // ACCIÓN SOLO PARA ADMINS
  public async rebootDevice(device: Device): Promise<void> {
    // 1. Candado de seguridad (Lógica)
    if (!this.isAdmin()) {
      this.notificationService.error(
        'Acceso Denegado',
        'Solo los administradores pueden reiniciar equipos.',
      );
      return;
    }

    // 2. Confirmación visual
    const confirmed = await this.notificationService.confirm(
      `¿Reiniciar el sensor "${device.nombre}"?`,
      'Esta acción reiniciará temporalmente el dispositivo.',
    );

    if (!confirmed) return;

    // 3. Llamada al servicio (Simulada)
    this.apiService.toggleDevice(device.mac_address).subscribe(() => {
      this.notificationService.success('Comando Enviado', `Reinicio enviado a ${device.nombre}`);
    });
  }

  // --- MÉTODOS DE BÚSQUEDA Y FILTRADO ---
  public onSearchChange(): void {
    this.currentPage.set(1);
    this.applyFilters();
  }

  public setStatusFilter(status: 'all' | 'online' | 'offline'): void {
    this.statusFilter.set(status);
    this.currentPage.set(1);
    this.applyFilters();
  }

  // Método helper para normalizar texto (quitar tildes y minusculas)
  private normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  // --- MÉTODOS DE EDICIÓN ---
  public openEditDeviceModal(device: Device): void {
    this.selectedDevice.set(device);
    this.editedDeviceName.set(device.nombre);
    this.isEditModalOpen.set(true);
  }

  public closeEditDeviceModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedDevice.set(null);
    this.editedDeviceName.set('');
  }

  public saveDeviceChanges(): void {
    const device = this.selectedDevice();
    const newName = this.editedDeviceName();

    if (!device || !newName.trim()) return;

    this.apiService.updateDevice(device.mac_address, { nombre: newName }).subscribe({
      next: () => {
        this.notificationService.success('Éxito', 'Dispositivo actualizado correctamente');
        this.closeEditDeviceModal();
        this.loadDevices(); // Recargar para ver cambios
      },
      error: (err) => {
        console.error('Error actualizando dispositivo:', err);
        this.notificationService.error('Error', 'No se pudo actualizar el dispositivo');
      }
    });
  }

  public applyFilters(): void {
    let filtered = [...this.devices()];

    // Filtrar por estado
    if (this.statusFilter() !== 'all') {
      if (this.statusFilter() === 'online') {
        filtered = filtered.filter((device) => device.estado === true);
      } else {
        filtered = filtered.filter((device) => device.estado === false);
      }
    }

    // Filtrar por término de búsqueda
    const term = this.normalizeText(this.searchTerm());
    if (term) {
      filtered = filtered.filter(
        (device) =>
          this.normalizeText(device.nombre).includes(term) ||
          this.normalizeText(device.mac_address).includes(term),
      );
    }

    this.filteredDevices.set(filtered);
    this.updatePaginatedDevices();
  }

  // Contador de dispositivos por estado
  public getDeviceCountByStatus(status: 'online' | 'offline'): number {
    if (status === 'online') {
      return this.devices().filter((d) => d.estado === true).length;
    } else {
      return this.devices().filter((d) => d.estado === false).length;
    }
  }

  // Formatear fecha en hora local
  public formatLocalTime(date: Date | undefined): string {
    if (!date) return 'No disponible';

    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  // Formatear tiempo relativo (hace X minutos)
  public formatRelativeTime(date: Date | undefined): string {
    if (!date) return 'Desconocido';

    const now = new Date().getTime();
    const then = new Date(date).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return `Hace ${diffDays} días`;
  }

  // --- MÉTODOS DE PAGINACIÓN ---
  updatePaginatedDevices() {
    const filtered = this.filteredDevices();
    this.totalPages.set(Math.ceil(filtered.length / this.pageSize()));
    const startIndex = (this.currentPage() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    this.paginatedDevices.set(filtered.slice(startIndex, endIndex));
  }

  changePage(page: number) {
    const total = this.totalPages();
    if (page >= 1 && page <= total) {
      this.currentPage.set(page);
      this.updatePaginatedDevices();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.updatePaginatedDevices();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.updatePaginatedDevices();
    }
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }
}
