import { Component, EventEmitter, Output, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './register-modal.component.html',
  styleUrls: ['./register-modal.component.css'],
})
export class RegisterModalComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @Output() close = new EventEmitter<void>();
  @Output() switchToLogin = new EventEmitter<void>();

  step: 'selection' | 'pin-verification' | 'form' = 'selection';
  selectedRole: 'user' | 'caregiver' = 'user';

  // State for PIN verification
  pin: string = '';
  pinError: boolean = false;

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
  showSuccessModal = false;
  ageError = false;
  minAge = 18;

  chooseRole(role: 'user' | 'caregiver') {
    this.selectedRole = role;
    this.registerData.role = role;
    
    if (role === 'caregiver') {
      this.step = 'pin-verification';
      this.pin = '';
      this.pinError = false;
    } else {
      this.step = 'form';
    }
  }

  goBack() {
    if (this.step === 'pin-verification') {
      this.step = 'selection';
    } else if (this.step === 'form') {
      // If we are in form and role is caregiver, go back to PIN, else selection
      if (this.selectedRole === 'caregiver') {
        this.step = 'pin-verification';
      } else {
        this.step = 'selection';
      }
    } else {
      this.step = 'selection';
    }
  }

  verifyPin() {
    if (this.pin === '7777') {
      this.step = 'form';
      this.pinError = false;
    } else {
      this.pinError = true;
      // Shake animation effect or focus can be added here if needed
      setTimeout(() => {
        this.pinError = false; // Reset error after a brief period to allow retry animation reset if implemented
      }, 2000);
    }
  }

  // register-modal.component.ts

  onSubmit() {
    // Validar edad si es paciente
    if (this.selectedRole === 'user') {
      this.validateAge();
      if (this.ageError) {
        alert('⚠️ Debes ser mayor de 18 años para registrarte como paciente.');
        return;
      }
    }

    if (this.registerData.email && this.registerData.password && this.registerData.name) {
      this.isLoading = true;

      // 1. Preparamos el objeto EXACTO que pide el Backend
      const payload: any = {
        email: this.registerData.email,
        password: this.registerData.password,
        name: this.registerData.name,
        telefono: this.registerData.telefono || null,
      };

      // 2. Añadimos campos específicos según el rol
      const tipo = this.selectedRole === 'caregiver' ? 'cuidador' : 'usuario';

      if (tipo === 'usuario') {
        payload.direccion = this.registerData.direccion || null;

        // Calcular edad desde fecha_nacimiento si está disponible
        if (this.registerData.fecha_nacimiento) {
          payload.fecha_nacimiento = this.registerData.fecha_nacimiento; // ✅ ENVIAR FECHA REAL!

          const birthDate = new Date(this.registerData.fecha_nacimiento);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          payload.edad = age;
        } else {
          payload.fecha_nacimiento = null;
          payload.edad = null;
        }

        payload.dispositivo_mac = null; // Será asignado por un admin después
      } else {
        payload.is_admin = false; // Por defecto cuidador normal
      }

      // 3. Llamada al servicio
      this.authService.register(payload, tipo).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.showSuccessModal = true;

          // Solo refrescar la lista si el que registra es un admin o cuidador logueado
          // Si es un usuario nuevo registrándose él mismo, no tiene tokens aún (por eso daba 401)
          const currentUser = this.authService.currentUser();
          if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'caregiver')) {
            this.userService.refreshUsers();
          }

          this.cdr.detectChanges(); // Forzar detección de cambios
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error en registro:', err);
          const errorMsg = err.error?.message || 'Error al registrar. Revisa los datos';
          alert('❌ ' + errorMsg);
        },
      });
    } else {
      alert('⚠️ Por favor completa todos los campos obligatorios');
    }
  }

  get roleTitle() {
    return this.selectedRole === 'caregiver' ? 'Cuenta de Cuidador 🏥' : 'Cuenta de Paciente 👤';
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.switchToLogin.emit();
  }

  validateAge() {
    if (this.registerData.fecha_nacimiento) {
      const birthDate = new Date(this.registerData.fecha_nacimiento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      this.ageError = age < this.minAge;
    } else {
      this.ageError = false;
    }
  }
}
