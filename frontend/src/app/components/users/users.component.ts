import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {

  private userService = inject(UserService);
  private authService = inject(AuthService);

  // Signals
  public users = signal<User[]>([]);
  public isLoading = signal<boolean>(true);
  
  // Seguridad: Solo el admin debería estar aquí
  public isAdmin = computed(() => this.authService.currentUser()?.role === 'admin');

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getAllUsers().subscribe(data => {
      this.users.set(data);
      this.isLoading.set(false);
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`¿Estás seguro de eliminar a ${user.fullName}?`)) return;

    this.userService.deleteUser(user.id).subscribe(() => {
      this.users.update(list => list.filter(u => u.id !== user.id));
      alert('Usuario eliminado correctamente');
    });
  }
  
  public addUser(): void {
    // 1. Pedir datos básicos
    const name = prompt('👤 Nombre completo del usuario:');
    if (!name) return; // Si cancela, paramos
    
    const email = prompt('📧 Email del usuario:');
    if (!email) return;

    // 2. Pedir rol (con valor por defecto 'caregiver')
    const roleInput = prompt('🔑 Rol (escribe: admin, caregiver o user):', 'caregiver');
    if (!roleInput) return;

    // 3. Validar rol (si escribe cualquier cosa, le asignamos 'user')
    const validRoles = ['admin', 'caregiver', 'user'];
    const finalRole = validRoles.includes(roleInput.toLowerCase()) ? roleInput.toLowerCase() : 'user';

    // 4. Crear el objeto usuario temporal
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9), // ID aleatorio
      username: name.replace(/\s+/g, '').toLowerCase(), // Juan Perez -> juanperez
      fullName: name,
      email: email,
      role: finalRole as any, // Forzamos el tipo
      status: 'active',
      lastLogin: undefined
    };

    // 5. Guardar
    this.isLoading.set(true);
    this.userService.createUser(newUser).subscribe(createdUser => {
      // Añadimos el nuevo usuario a la lista visual (Signals)
      this.users.update(currentList => [...currentList, createdUser]);
      this.isLoading.set(false);
      alert(`✅ Usuario ${createdUser.fullName} creado con éxito.`);
    });
  }
}
