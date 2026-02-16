import { Component, inject, OnInit, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Action } from 'rxjs/internal/scheduler/Action';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service'; // 👈 Importamos ApiService
import { AlertService } from '../../services/alert.service';
import { NotificationService } from '../../services/notification.service';
import { Alert } from '../../models/alert.model';
import { User } from '../../models/user.model';
import { Device } from '../../models/device'; // 👈 Importamos Device
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private apiService = inject(ApiService); // 👈 Inyectamos ApiService
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private cd = inject(ChangeDetectorRef);
  private notificationService = inject(NotificationService); // 👈 Inyectamos NotificationService

  public users: User[] = [];
  public filteredUsers: User[] = [];
  public paginatedUsers: User[] = [];
  public isLoading = true;

  // Variables de paginación
  public currentPage = 1;
  public pageSize = 5;
  public totalPages = 1;

  // Variables de filtro
  public activeFilter: 'user' | 'caregiver' | 'admin' = 'user';
  public searchTerm: string = '';
  public isAlphabeticalOrder: boolean = true;

  // Variables Modal Edición
  public isEditModalOpen = false;
  public selectedUser: User = {} as User;

  // Variables Modal Historial 🆕
  public isHistoryModalOpen = false;
  public userHistory: Alert[] = [];
  public selectedHistoryUserName = '';

  // Variables Modal Información del Usuario (Antes Paciente) 🆕
  public isUserInfoModalOpen = false;
  public selectedUserInfo: any = null;
  public isLoadingUserInfo = false;

  // Variables Modal Asignar Dispositivo 🆕
  public isAssignDeviceModalOpen = false;
  public availableDevices: Device[] = [];
  public selectedDeviceMac: string = '';
  public isLoadingDevices = false;

  // 🔐 ROLES
  public isAdmin = computed(() => this.authService.currentUser()?.role === 'admin');

  // Admin O Cuidador pueden ver historial
  public canViewHistory = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'caregiver';
  });

  ngOnInit() {
    console.log('UsersComponent initialized - Debugging Device Assignment Fix v2');
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    const currentUserRole = this.authService.currentUser()?.role;

    this.userService.getAllUsers().subscribe({
      next: (data) => {
        // Filtrar usuarios según el rol del usuario actual
        if (currentUserRole === 'admin') {
          // Los admins ven a todos
          this.users = data;
        } else if (currentUserRole === 'caregiver') {
          // Los cuidadores ven solo pacientes y cuidadores
          this.users = data.filter((u) => u.role !== 'admin');
        } else {
          this.users = [];
        }
        
        // Recalcular contadores de forma segura
        this.calculateCounts();
        this.applyFilter();
        this.isLoading = false;
        
        // Marcar para verificación en lugar de forzar detección inmediata
        this.cd.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.isLoading = false;
        this.cd.markForCheck();
      },
    });
  }

  // --- MODAL EDICIÓN ---
  openEditModal(user: User) {
    this.selectedUser = { ...user };
    this.isEditModalOpen = true;
  }
  closeEditModal() {
    this.isEditModalOpen = false;
  }

  saveUserChanges() {
    if (!this.selectedUser.id) return;

    this.userService.updateUser(this.selectedUser.id, this.selectedUser).subscribe({
      next: () => {
        console.log('Usuario actualizado correctamente');
        
        // Diferir al siguiente ciclo para evitar NG0100
        setTimeout(() => {
          // Cerrar modal
          this.isEditModalOpen = false;
          
          // Forzar recarga desde el servidor
          this.userService.refreshUsers();
          
          this.notificationService.success('Éxito', 'Usuario actualizado correctamente');
        }, 0);
      },
      error: (err) => {
        console.error('Error actualizando usuario:', err);
        this.isLoading = false;
        this.notificationService.error(
          'Error',
          'Error al guardar los cambios. Inténtalo de nuevo.',
        );
      },
    });
  }

  exportUsers() {
    // 🟢 EXPORTACIÓN CLIENT-SIDE (Lo que ves es lo que exportas)
    // Esto evita problemas con el backend devolviendo archivos vacíos para ciertos roles.
    
    if (this.filteredUsers.length === 0) {
      this.notificationService.warning('Aviso', 'No hay usuarios para exportar en la vista actual.');
      return;
    }

    const headers = ['ID', 'Nombre', 'Email', 'Usuario', 'Rol', 'Estado', 'Teléfono', 'Dirección', 'Fecha Nacimiento', 'Dispositivo MAC', 'Último Login'];
    
    const safe = (val: any) => `"${(val || '').toString().replace(/"/g, '""')}"`;

    const csvRows = this.filteredUsers.map(user => [
      safe(user.id),
      safe(user.fullName),
      safe(user.email),
      safe(user.username),
      safe(user.role === 'user' ? 'Paciente' : user.role === 'caregiver' ? 'Cuidador' : 'Admin'),
      safe(user.status === 'active' ? 'Activo' : 'Inactivo'),
      safe(user.telefono),
      safe(user.direccion),
      safe(user.fecha_nacimiento ? new Date(user.fecha_nacimiento).toLocaleDateString() : ''),
      safe(user.dispositivo_mac),
      safe(user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '')
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    // Crear Blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.notificationService.success('Éxito', `${this.filteredUsers.length} usuarios exportados correctamente.`);
  }

  exportSingleUserCSV() {
    if (!this.selectedUserInfo) return;

    const user = this.selectedUserInfo;
    // Definir cabeceras y datos
    const headers = ['ID', 'Nombre', 'Email', 'Usuario', 'Rol', 'Estado', 'Teléfono', 'Dirección', 'Fecha Nacimiento', 'Dispositivo MAC', 'Fecha Creación'];
    
    // Función auxiliar para escapar comillas y manejar nulos
    const safe = (val: any) => `"${(val || '').toString().replace(/"/g, '""')}"`;

    const row = [
      safe(user.id),
      safe(user.fullName),
      safe(user.email),
      safe(user.username),
      safe(user.role),
      safe(user.status),
      safe(user.telefono),
      safe(user.direccion),
      safe(user.fecha_nacimiento),
      safe(user.dispositivo_mac),
      safe(user.created_at)
    ];

    const csvContent = [
      headers.join(','),
      row.join(',')
    ].join('\n');

    // Crear Blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `paciente_${user.username}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.notificationService.success('Éxito', `Datos de ${user.fullName} exportados.`);
  }

  // Variable para controlar el modal de confirmación
  public isDeleteConfirmModalOpen = false;
  public userToDelete: User | null = null;

  deleteUser(user: User) {
    // En lugar de usar confirm(), abrimos nuestro modal personalizado
    this.userToDelete = user;
    this.isDeleteConfirmModalOpen = true;
  }

  closeDeleteConfirmModal() {
    this.isDeleteConfirmModalOpen = false;
    this.userToDelete = null;
  }

  confirmDeleteUser() {
    if (!this.userToDelete) return;

    const userToDelete = this.userToDelete;
    this.closeDeleteConfirmModal();

    this.userService.deleteUser(userToDelete.id, userToDelete.role).subscribe({
      next: () => {
        this.notificationService.success('Éxito', 'Usuario eliminado correctamente');
        this.userService.refreshUsers();
      },
      error: (err) => {
        console.error('Error eliminando usuario:', err);
        this.notificationService.error('Error', 'Error al eliminar el usuario.');
      },
    });
  }

  // Verificar si un rol está disponible para el usuario actual
  isRoleAvailable(role: 'admin' | 'caregiver' | 'user'): boolean {
    if (!this.selectedUser) return false;
    
    // Si es paciente, solo puede ser paciente
    if (this.selectedUser.role === 'user') {
      return role === 'user';
    }
    
    // Si es cuidador o admin, solo puede ser cuidador o admin
    return role === 'admin' || role === 'caregiver';
  }

  // --- MODAL HISTORIAL (NUEVO) 🆕 ---
  openHistoryModal(user: User) {
    this.selectedHistoryUserName = user.fullName;

    // Si es un paciente, buscar alertas por deviceId
    if (user.role === 'user') {
      this.alertService.getAlertsByDeviceId(String(user.id)).subscribe((data) => {
        this.userHistory = data;
        this.isHistoryModalOpen = true;
      });
    }
    // Si es cuidador o admin, buscar alertas atendidas por ellos
    else if (user.role === 'caregiver' || user.role === 'admin') {
      this.alertService.getAlertsByCaregiver(user.fullName).subscribe((data) => {
        this.userHistory = data;
        this.isHistoryModalOpen = true;
      });
    }
  }

  closeHistoryModal() {
    this.isHistoryModalOpen = false;
  }

  // --- MODAL INFORMACIÓN DEL USUARIO (NUEVO) 🆕 ---
  getModalHeaderClass(role: string): string {
    // Default safe class
    const baseClass = 'relative overflow-hidden px-8 py-8 transition-colors duration-300 ';
    
    switch (role) {
      case 'user':
        return baseClass + 'bg-gradient-to-br from-blue-600 to-blue-800';
      case 'caregiver':
        return baseClass + 'bg-gradient-to-br from-green-600 to-green-800';
      case 'admin':
        return baseClass + 'bg-gradient-to-br from-red-600 to-red-800';
      default:
        // Fallback para debug (Gris oscuro)
        console.warn('Role not recognized or empty:', role);
        return baseClass + 'bg-gray-800'; 
    }
  }

  openUserInfoModal(user: User) {
    // Definir estado inicial antes de abrir el modal para evitar parpadeos/errores
    this.selectedUserInfo = { ...user };
    this.isUserInfoModalOpen = true;

    // Si es un paciente (USER), pedimos detalles adicionales al backend
    // Usamos setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError si la respuesta es sincrónica/rápida
    if (user.role === 'user') {
      this.isLoadingUserInfo = true;
      
      this.userService.getUserById(user.id).subscribe({
        next: (data) => {
          // Fusionamos los datos con un pequeño delay para asegurar ciclo de digestión limpio
          setTimeout(() => {
            this.selectedUserInfo = { ...this.selectedUserInfo, ...data };
            this.isLoadingUserInfo = false;
            this.cd.markForCheck(); // Usar markForCheck en lugar de detectChanges
          });
        },
        error: (err) => {
          console.error('Error cargando información del usuario:', err);
          setTimeout(() => {
            this.isLoadingUserInfo = false;
            this.cd.markForCheck();
          });
        },
      });
    } else {
      // Para admin/caregiver no hay carga extra
      this.isLoadingUserInfo = false;
    }
  }

  closeUserInfoModal() {
    this.isUserInfoModalOpen = false;
    this.selectedUserInfo = null;
  }

  // --- MODAL ASIGNAR DISPOSITIVO (NUEVO) 🆕 ---
  openAssignDeviceModalV2(user: User | null) {
    console.log('openAssignDeviceModalV2 called with:', user);
    if (!user) {
      console.error('openAssignDeviceModalV2 called with null user - Aborting');
      return;
    }
    if (user.role !== 'user') {
      console.warn('User is not a patient:', user.role);
      return;
    }
    this.selectedUser = { ...user };
    this.selectedDeviceMac = '';
    this.isAssignDeviceModalOpen = true;
    this.isLoadingDevices = true;

    // Cargar dispositivos disponibles
    this.apiService.getDevices().subscribe({
      next: (devices) => {
        // Filtrar dispositivos que NO están asignados verificando contra la lista de usuarios cargada
        // Obtenemos un Set de las MACs que ya están asignadas a algún dispositivo
        const assignedMacs = new Set(
          this.users
            .map(u => u.dispositivo_mac)
            .filter(mac => !!mac) // Solo MACs válidas
        );

        // Filtramos solo los dispositivos cuya MAC no esté en el set de asignados
        this.availableDevices = devices.filter(d => !assignedMacs.has(d.mac_address));
        
        this.isLoadingDevices = false;
        this.cd.detectChanges(); // 👈 Forzar actualización de vista
      },
      error: (err) => {
        console.error('Error cargando dispositivos:', err);
        this.isLoadingDevices = false;
        this.cd.detectChanges(); // 👈 Forzar actualización de vista en error
      }
    });
  }

  closeAssignDeviceModal() {
    this.isAssignDeviceModalOpen = false;
    this.availableDevices = [];
  }

  assignDevice() {
    if (!this.selectedUser.id || !this.selectedDeviceMac) return;

    this.userService.assignDevice(Number(this.selectedUser.id), this.selectedDeviceMac).subscribe({
      next: (res) => {
        this.notificationService.success('Éxito', `Dispositivo asignado a ${this.selectedUser.fullName}`);
        // Defer UI updates to next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.closeAssignDeviceModal();
          this.userService.refreshUsers(); 
        }, 0);
      },
      error: (err) => {
        console.error('Error asignando dispositivo:', err);
        if (err.status === 409) {
             this.notificationService.warning('Conflicto', 'El dispositivo ya está asignado a otro usuario.');
        } else {
             this.notificationService.error('Error', 'No se pudo asignar el dispositivo.');
        }
      }
    });
  }

  // --- MÉTODOS DE FILTRADO ---
  setFilter(filter: 'user' | 'caregiver' | 'admin') {
    this.activeFilter = filter;
    this.currentPage = 1; // Reset a la primera página
    this.applyFilter();
  }

  onSearchChange() {
    this.currentPage = 1;
    setTimeout(() => this.applyFilter(), 0);
  }

  toggleAlphabeticalOrder() {
    this.isAlphabeticalOrder = !this.isAlphabeticalOrder;
    this.applyFilter();
  }

  // Método helper para normalizar texto (quitar tildes y minusculas)
  normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  applyFilter() {
    // Filtrar por rol
    let filtered = this.users.filter((u) => u.role === this.activeFilter);

    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.normalizeText(this.searchTerm);

      filtered = filtered.filter(
        (u) =>
          this.normalizeText(u.fullName).includes(term) ||
          this.normalizeText(u.email).includes(term) ||
          (u.username && this.normalizeText(u.username).includes(term)),
      );
    }

    // Ordenar alfabéticamente
    if (this.isAlphabeticalOrder) {
      filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else {
      filtered.sort((a, b) => b.fullName.localeCompare(a.fullName));
    }

    this.filteredUsers = filtered;
    this.updatePaginatedUsers();
  }

  // --- MÉTODOS DE PAGINACIÓN ---
  updatePaginatedUsers() {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedUsers();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedUsers();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedUsers();
    }
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Contadores cacheados para evitar NG0100
  public userCount = 0;
  public caregiverCount = 0;
  public adminCount = 0;

  private calculateCounts() {
    // Asegurar que this.users existe y es un array antes de calcular
    if (!this.users || !Array.isArray(this.users)) {
      this.userCount = 0;
      this.caregiverCount = 0;
      this.adminCount = 0;
      return;
    }
    
    this.userCount = this.users.filter((u) => u.role === 'user').length;
    this.caregiverCount = this.users.filter((u) => u.role === 'caregiver').length;
    this.adminCount = this.users.filter((u) => u.role === 'admin').length;
  }

  // --- MÉTODOS HELPER PARA CONTEO ---
  // Ya no se usa en el template directamente para evitar recalculos
  getUserCountByRole(role: 'user' | 'caregiver' | 'admin'): number {
    switch (role) {
      case 'user':
        return this.userCount;
      case 'caregiver':
        return this.caregiverCount;
      case 'admin':
        return this.adminCount;
      default:
        return 0;
    }
  }
}
