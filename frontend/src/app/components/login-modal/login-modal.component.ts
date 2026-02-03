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
  styleUrl: './login-modal.component.css'
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
    this.isLoading = true;
    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      // ✅ APLICADO: Tipado explícito para evitar error de TypeScript
      next: (response: { token: string; user: any }) => {
        this.finalizeLogin(response);
      },
      error: () => {
        this.isLoading = false;
        alert('Credenciales incorrectas');
      }
    });
  }

  // --- 👇 NUEVO: OLVIDASTE CONTRASEÑA ---
  onForgotPassword() {
    if (!this.loginData.email) {
      alert('⚠️ Por favor, escribe tu email en la casilla primero para poder enviarte el enlace.');
      return;
    }
    
    // Aquí conectarías con tu lógica de recuperación
    alert(`✅ Hemos enviado un enlace de recuperación a: ${this.loginData.email}\n(Revisa tu bandeja de entrada o spam)`);
  }

  // --- 👇 LÓGICA DE GOOGLE ---
  async onGoogleLogin() {
    this.isLoading = true;
    
    try {
      // Llamamos al servicio (Simulado o Firebase)
      const user = await this.authService.loginWithGoogle();
      
      // Simulamos una respuesta de backend con los datos de Google
      const response = {
        token: 'google-session-token', 
        user: user
      };

      this.finalizeLogin(response);

    } catch (error) {
      console.error('Error Google:', error);
      this.isLoading = false;
    }
  }

  // ✅ APLICADO: Función auxiliar con tipos definidos
  private finalizeLogin(response: { token: string; user: any }) {
    this.authService.saveToken(response.token);
    this.authService.saveSession(response.user);
    this.isLoading = false;
    this.close.emit(); 
    this.router.navigate(['/dashboard']);
  }
}