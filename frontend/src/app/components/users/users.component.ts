import { Component, inject, OnInit, ChangeDetectorRef, computed } from '@angular/core'; // 👈 Añadido computed
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service'; // 👈 Añadido AuthService
import { User } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService); // 👈 Inyectamos Auth para ver el rol
  private cd = inject(ChangeDetectorRef);
  
  public users: User[] = [];
  public isLoading = true;

  // Variables para el Modal
  public isEditModalOpen = false;
  public selectedUser: User = {} as User;

  // 🔐 COMPUTED: Verifica si el usuario actual es ADMIN
  // Esto se actualiza automáticamente si cambia el usuario en el AuthService
  public isAdmin = computed(() => {
    return this.authService.currentUser()?.role === 'admin';
  });

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    // 1. Empezamos la carga
    this.isLoading = true;
    
    // 2. Pedimos los datos
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        console.log('✅ Datos recibidos en el componente:', data);
        
        // 3. Guardamos los datos
        this.users = data;
        this.isLoading = false; 

        // 4. 🚨 FORZAMOS LA ACTUALIZACIÓN VISUAL 🚨
        this.cd.detectChanges(); 
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  // --- MÉTODOS DEL MODAL ---
  // Solo los admin deberían poder llamar a esto, pero lo protegemos en el HTML
  openEditModal(user: User) {
    this.selectedUser = { ...user }; 
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  saveUserChanges() {
    this.userService.updateUser(this.selectedUser.id, this.selectedUser).subscribe(() => {
      alert('✅ Usuario actualizado');
      this.isEditModalOpen = false;
      this.loadUsers(); 
    });
  }

  deleteUser(id: string | number) {
    if(confirm('¿Seguro que quieres borrar este usuario?')) {
      this.userService.deleteUser(id).subscribe(() => this.loadUsers());
    }
  }
}