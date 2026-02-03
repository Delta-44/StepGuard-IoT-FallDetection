import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styles: [`
    /* ESTILOS DEL MODAL (CSS INCORPORADO) */
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5); /* Fondo oscuro transparente */
      display: flex; justify-content: center; align-items: center;
      z-index: 1000;
      backdrop-filter: blur(2px); /* Efecto borroso pro */
    }
    .modal-content {
      background: white; padding: 25px; border-radius: 12px;
      width: 90%; max-width: 400px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
    }
    .form-group { margin-bottom: 15px; }
    .form-label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; }
    .form-input { 
      width: 100%; padding: 10px; border: 1px solid #ddd; 
      border-radius: 6px; box-sizing: border-box; font-size: 1em;
    }
    .btn-group { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
    
    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class UsersComponent implements OnInit {

  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);

  public users = signal<User[]>([]);
  public isLoading = signal<boolean>(true);
  
  // 🆕 SIGNAL PARA CONTROLAR EL MODAL
  public showModal = signal<boolean>(false);
  public userForm!: FormGroup;

  public isAdmin = computed(() => this.authService.currentUser()?.role === 'admin');

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
  }

  initForm(): void {
    this.userForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['user', Validators.required],
      telefono: [''],
      direccion: [''],
      edad: [null]
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getAllUsers().subscribe((data: any) => {
      this.users.set(data);
      this.isLoading.set(false);
    });
  }

  // 1. ABRIR EL FORMULARIO
  openCreateModal(): void {
    this.initForm(); // Resetear el formulario
    this.showModal.set(true);
  }

  // 2. CERRAR EL FORMULARIO
  closeCreateModal(): void {
    this.showModal.set(false);
    this.userForm.reset();
  }

  // 3. GUARDAR usuario desde el formulario
  saveUser(): void {
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
      alert('Por favor, completa todos los campos correctamente.');
      return;
    }

    const formData = this.userForm.value;
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: formData.username,
      fullName: formData.fullName,
      email: formData.email,
      role: formData.role,
      status: 'active',
      telefono: formData.telefono || undefined,
      direccion: formData.direccion || undefined,
      edad: formData.edad || undefined,
      is_admin: formData.role === 'admin'
    };

    this.isLoading.set(true);
    this.userService.createUser(newUser).subscribe((createdUser: any) => {
      this.users.update((list: any) => [...list, createdUser]);
      this.isLoading.set(false);
      this.closeCreateModal();
      alert('Usuario creado exitosamente');
    }, error => {
      this.isLoading.set(false);
      alert('Error al crear usuario: ' + (error.message || 'Error desconocido'));
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`¿Eliminar a ${user.fullName}?`)) return;
    this.userService.deleteUser(user.id).subscribe(() => {
      this.users.update((list: any[]) => list.filter(u => u.id !== user.id));
    });
  }
}