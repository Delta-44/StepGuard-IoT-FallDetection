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
  styleUrls: ['./register-modal.component.css'],
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
    telefono: '', // Común
    direccion: '', // Solo Paciente
    fecha_nacimiento: '', // Solo Paciente
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

  // register-modal.component.ts

  onSubmit() {
    // Validamos que los campos básicos existan en registerData
    if (this.registerData.email && this.registerData.password && this.registerData.name) {
      this.isLoading = true;

      // Determinamos el tipo según el rol seleccionado
      const tipo = this.selectedRole === 'caregiver' ? 'cuidador' : 'usuario';

      this.authService.register(this.registerData, tipo).subscribe({
        next: (response) => {
          this.isLoading = false;
          alert('✅ Registro completado con éxito.');
          this.close.emit(); // 👈 Cambiado: usamos el Output 'close'
          // Opcional: podrías redirigir al login o dashboard
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error en registro', err);
          alert('Hubo un error al crear la cuenta. Inténtalo de nuevo.');
        },
      });
    } else {
      alert('Por favor, completa todos los campos obligatorios.');
    }
  }

  get roleTitle() {
    return this.selectedRole === 'caregiver' ? 'Cuenta de Cuidador 🏥' : 'Cuenta de Paciente 👤';
  }
}
