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
  public isLoading = true;

  // Variables Modal Edición
  public isEditModalOpen = false;
  public selectedUser: User = {} as User;

  // Variables Modal Historial 🆕
  public isHistoryModalOpen = false;
  public userHistory: Alert[] = [];
  public selectedHistoryUserName = '';

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
        this.isLoading = false; 
        this.cd.detectChanges();
      },
      error: () => this.isLoading = false
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
}