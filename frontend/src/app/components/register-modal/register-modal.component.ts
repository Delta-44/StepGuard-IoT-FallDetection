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
    fecha_nacimiento: '', // Solo Paciente (convertiremos a edad)
    edad: 0, // Edad calculada
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
    if (this.registerData.email && this.registerData.password && this.registerData.name) {
      this.isLoading = true;

      // 1. Preparamos el objeto EXACTO que pide el Backend
      const payload: any = {
        email: this.registerData.email,
        password: this.registerData.password,
        name: this.registerData.name,
        telefono: this.registerData.telefono || null
      };

      // 2. Añadimos campos específicos según el rol
      const tipo = this.selectedRole === 'caregiver' ? 'cuidador' : 'usuario';

      if (tipo === 'usuario') {
        payload.direccion = this.registerData.direccion || null;
        
        // Calcular edad desde fecha_nacimiento si está disponible
        if (this.registerData.fecha_nacimiento) {
          const birthDate = new Date(this.registerData.fecha_nacimiento);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          payload.edad = age;
        } else {
          payload.edad = null;
        }
        
        payload.dispositivo_id = null; // Será asignado por un admin después
      } else {
        payload.is_admin = false; // Por defecto cuidador normal
      }

      // 3. Llamada al servicio
      this.authService.register(payload, tipo).subscribe({
        next: (res) => {
          this.isLoading = false;
          alert('✅ ¡Registro exitoso! Ya puedes loguearte.');
          this.close.emit();
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error en registro:', err);
          const errorMsg = err.error?.message || 'Error al registrar. Revisa los datos';
          alert('❌ ' + errorMsg);
        }
      });
    } else {
      alert('⚠️ Por favor completa todos los campos obligatorios');
    }
  }

  get roleTitle() {
    return this.selectedRole === 'caregiver' ? 'Cuenta de Cuidador 🏥' : 'Cuenta de Paciente 👤';
  }
}
