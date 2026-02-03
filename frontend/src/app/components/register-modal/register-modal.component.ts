import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-modal.component.html',
  styleUrls: ['./register-modal.component.css']
})
export class RegisterModalComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  @Output() close = new EventEmitter<void>();
  @Output() switchToLogin = new EventEmitter<void>();

  step: 'selection' | 'form' = 'selection';
  selectedRole: 'user' | 'caregiver' = 'user';
  
  // ✅ ACTUALIZADO: Añadimos los campos nuevos de tus interfaces
  registerData = { 
    name: '', 
    email: '', 
    password: '', 
    role: '',
    telefono: '',          // Común
    direccion: '',         // Solo Paciente
    fecha_nacimiento: ''   // Solo Paciente
  };
  
  isLoading = false;

  chooseRole(role: 'user' | 'caregiver') {
    this.selectedRole = role;
    this.registerData.role = role;
    this.step = 'form';
  }

  goBack() {
    this.step = 'selection';
  }

  onSubmit() {
    this.isLoading = true;
    const finalData = { ...this.registerData, role: this.selectedRole };

    this.authService.register(finalData).subscribe({
      next: (response: { token: string; user: any }) => {
        // 1. Guardar token y sesión
        this.authService.saveToken(response.token);
        this.authService.saveSession(response.user);
        
        // 2. ✅ NUEVO: Agregar usuario a la lista de UserService
        this.userService.createUser(response.user).subscribe({
          next: () => {
            console.log('✅ Usuario registrado y agregado a la lista');
            this.isLoading = false;
            this.close.emit();
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            console.error('Error al agregar usuario a la lista:', err);
            this.isLoading = false;
            // Aun así continuamos al dashboard ya que la autenticación fue exitosa
            this.close.emit();
            this.router.navigate(['/dashboard']);
          }
        });
      },
      error: () => {
        this.isLoading = false;
        alert('Error al registrar usuario');
      }
    });
  }

  get roleTitle() {
    return this.selectedRole === 'caregiver' ? 'Cuenta de Cuidador 🏥' : 'Cuenta de Paciente 👤';
  }
}