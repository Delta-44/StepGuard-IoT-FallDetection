import { Component, inject, OnInit, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { AlertService, Alert } from '../../services/alert.service'; // 👈 IMPORTANTE
import { User } from '../../models/user.model';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService); // 👈 Inyectamos
  private cd = inject(ChangeDetectorRef);
  
  public users: User[] = [];
  public filteredUsers: User[] = [];
  public paginatedUsers: User[] = [];
  public isLoading = true;
  
  // Variables de paginación
  public currentPage = 1;
  public pageSize = 5;
  public totalPages = 1;
  
  // Variables de filtro
  public activeFilter: 'user' | 'caregiver' = 'user';
  public searchTerm: string = '';
  public isAlphabeticalOrder: boolean = true;

  // Variables Modal Edición
  public isEditModalOpen = false;
  public selectedUser: User = {} as User;

  // Variables Modal Historial 🆕
  public isHistoryModalOpen = false;
  public userHistory: Alert[] = [];
  public selectedHistoryUserName = '';

  // Variables Modal Información del Paciente 🆕
  public isPatientInfoModalOpen = false;
  public selectedPatientInfo: any = null;
  public isLoadingPatientInfo = false;

  // 🔐 ROLES
  public isAdmin = computed(() => this.authService.currentUser()?.role === 'admin');
  
  // Admin O Cuidador pueden ver historial
  public canViewHistory = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'admin' || role === 'caregiver';
  });

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    const currentUserRole = this.authService.currentUser()?.role;
    
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        // Filtrar usuarios según el rol del usuario actual
        if (currentUserRole === 'admin') {
          // Los admins ven a todos (pacientes, cuidadores y otros admins)
          this.users = data;
        } else if (currentUserRole === 'caregiver') {
          // Los cuidadores ven solo pacientes y otros cuidadores (NO admins)
          this.users = data.filter(u => u.role !== 'admin');
        } else {
          // Los pacientes no deberían acceder a esta vista, pero por seguridad
          this.users = [];
        }
        this.applyFilter();
        this.isLoading = false; 
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  // --- MODAL EDICIÓN ---
  openEditModal(user: User) {
    this.selectedUser = { ...user }; 
    this.isEditModalOpen = true;
  }
  closeEditModal() { this.isEditModalOpen = false; }
  
  saveUserChanges() { /* ... tu código de guardar ... */ }
  deleteUser(id: any) { /* ... tu código de borrar ... */ }

  // --- MODAL HISTORIAL (NUEVO) 🆕 ---
  openHistoryModal(user: User) {
    this.selectedHistoryUserName = user.fullName;
    
    // Si es un paciente, buscar alertas por deviceId
    if (user.role === 'user') {
      this.alertService.getAlertsByDeviceId(String(user.id)).subscribe(data => {
        this.userHistory = data;
        this.isHistoryModalOpen = true;
      });
    } 
    // Si es cuidador o admin, buscar alertas atendidas por ellos
    else if (user.role === 'caregiver' || user.role === 'admin') {
      this.alertService.getAlertsByCaregiver(user.fullName).subscribe(data => {
        this.userHistory = data;
        this.isHistoryModalOpen = true;
      });
    }
  }

  closeHistoryModal() {
    this.isHistoryModalOpen = false;
  }

  // --- MODAL INFORMACIÓN DEL PACIENTE (NUEVO) 🆕 ---
  openPatientInfoModal(user: User) {
    if (user.role !== 'user') return; // Solo para pacientes
    
    // Inicializar inmediatamente para evitar ExpressionChangedAfterItHasBeenCheckedError
    this.selectedPatientInfo = user;
    this.isLoadingPatientInfo = true;
    this.isPatientInfoModalOpen = true;
    
    // Forzar detección de cambios para que el modal se abra inmediatamente
    this.cd.detectChanges();
    
    // Luego cargar datos completos del backend
    this.userService.getUserById(user.id).subscribe({
      next: (data) => {
        this.selectedPatientInfo = data;
        this.isLoadingPatientInfo = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando información del paciente:', err);
        this.isLoadingPatientInfo = false;
        this.cd.detectChanges();
        // selectedPatientInfo ya tiene los datos básicos del user
      }
    });
  }

  closePatientInfoModal() {
    this.isPatientInfoModalOpen = false;
    this.selectedPatientInfo = null;
  }

  // --- MÉTODOS DE FILTRADO ---
  setFilter(filter: 'user' | 'caregiver') {
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

  applyFilter() {
    // Filtrar por rol
    let filtered = this.users.filter(u => u.role === this.activeFilter);
    
    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(u => 
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.username && u.username.toLowerCase().includes(term))
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

  // --- MÉTODOS HELPER PARA CONTEO ---
  getUserCountByRole(role: 'user' | 'caregiver'): number {
    return this.users.filter(u => u.role === role).length;
  }
}