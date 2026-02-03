import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.css',
})
export class LoginModalComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @Output() close = new EventEmitter<void>();
  @Output() switchToRegister = new EventEmitter<void>();

  loginData = { email: '', password: '' };
  isLoading = false;

  // --- LÓGICA DE EMAIL / PASS ---
  onSubmit() {
  if (this.loginData.email && this.loginData.password) {
    this.isLoading = true;

    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (response) => {
        // ✅ No llamamos a nada más, el servicio ya guardó todo.
        console.log('✅ Login exitoso');
        this.isLoading = false;
        this.close.emit(); 
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ Error en login:', err);
        alert('Email o contraseña incorrectos');
      },
    });
  }
}

  // --- 👇 NUEVO: OLVIDASTE CONTRASEÑA ---
  onForgotPassword() {
    if (!this.loginData.email) {
      alert('⚠️ Por favor, escribe tu email en la casilla primero para poder enviarte el enlace.');
      return;
    }

    // Aquí conectarías con tu lógica de recuperación
    alert(
      `✅ Hemos enviado un enlace de recuperación a: ${this.loginData.email}\n(Revisa tu bandeja de entrada o spam)`,
    );
  }

  // --- 👇 LÓGICA DE GOOGLE ---
  async onGoogleLogin() {
  // El backend de tu compañero usa una redirección. 
  // Lo más sencillo es redirigir al usuario a la URL de Google que nos da el servicio.
  window.location.href = this.authService.getGoogleLoginUrl();
}

  // // ✅ APLICADO: Función auxiliar con tipos definidos
  // private finalizeLogin(response: { token: string; user: any }) {
  //   this.authService.saveToken(response.token);
  //   this.authService.saveSession(response.user);
  //   this.isLoading = false;
  //   this.close.emit();
  //   this.router.navigate(['/dashboard']);
  // }
}
