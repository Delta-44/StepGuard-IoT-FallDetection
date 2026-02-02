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
}
