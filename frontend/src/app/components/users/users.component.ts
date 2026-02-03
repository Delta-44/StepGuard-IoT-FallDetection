import { Component, inject, OnInit, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { AlertService, Alert } from '../../services/alert.service'; // 👈 IMPORTANTE
import { User } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
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
    // Convertimos el ID a string porque tu modelo Alert usa string en deviceId
    this.alertService.getAlertsByDeviceId(String(user.id)).subscribe(data => {
      this.userHistory = data;
      this.isHistoryModalOpen = true;
    });
  }

  closeHistoryModal() {
    this.isHistoryModalOpen = false;
  }
}