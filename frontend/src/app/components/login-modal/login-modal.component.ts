import { Component, EventEmitter, Output, inject, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

// Declaramos la variable de Google para que TypeScript no se queje
declare var google: any;

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.css',
})
export class LoginModalComponent implements AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone); // 👈 Necesario para volver a Angular desde Google
  private cdr = inject(ChangeDetectorRef);
  private notificationService = inject(NotificationService);

  @Output() close = new EventEmitter<void>();
  @Output() switchToRegister = new EventEmitter<void>();

  loginData = { email: '', password: '' };
  isLoading = false;
  showSuccessModal = false;
  showErrorModal = false;
  modalMessage = '';
  modalEmail = '';

  // --- 👇 INICIALIZAR BOTÓN DE GOOGLE ---
  ngAfterViewInit() {
    // CLIENT_ID de Google Cloud Console
    google.accounts.id.initialize({
      client_id: "644678657987-fukshit2bmdcvlfh3uv8rpfuhr72csqm.apps.googleusercontent.com",
      callback: (resp: any) => this.handleGoogleLogin(resp)
    });

    google.accounts.id.renderButton(
      document.getElementById("google-btn-container"),
      { theme: "outline", size: "large", width: "100%", text: "continue_with" } // Estilo oficial
    );
  }

  // --- 👇 LÓGICA DE RESPUESTA DE GOOGLE ---
  handleGoogleLogin(response: any) {
    // Google nos devuelve un 'credential' (el token)
    if (response.credential) {
      // Usamos ngZone.run porque esto viene de fuera de Angular
      this.ngZone.run(() => {
        this.isLoading = true;
        
        // Llamamos a tu servicio que hace el POST al backend
        this.authService.loginWithGoogle(response.credential).subscribe({
          next: (res) => {
            // Si es un usuario nuevo, mostrar selector de rol
            if (res.isNewUser) {
              console.log('⚠️ Usuario nuevo detectado:', res.email);
              this.isLoading = false;
              const role = prompt(`Usuario ${res.email} no registrado.\n\n¿Qué tipo de cuenta deseas?\n1. Usuario (persona mayor)\n2. Cuidador\n\nEscribe "usuario" o "cuidador":`);
              
              if (role === 'usuario' || role === 'cuidador') {
                this.isLoading = true;
                // Reenviar con el rol seleccionado
                this.authService.loginWithGoogle(response.credential, role).subscribe({
                  next: () => {
                    console.log('✅ Google registro exitoso con rol:', role);
                    this.isLoading = false;
                    this.close.emit();
                    this.router.navigate(['/dashboard']);
                  },
                  error: (err) => {
                    console.error('❌ Error registrando con Google:', err);
                    this.isLoading = false;
                    this.notificationService.error('Error de Registro', 'No se pudo completar el registro con Google');
                  }
                });
              } else {
                this.isLoading = false;
                this.notificationService.warning('Rol Inválido', 'Por favor, selecciona un rol válido');
              }
              return;
            }

            console.log('✅ Google Login exitoso');
            this.isLoading = false;
            this.close.emit();
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            console.error('❌ Error Google:', err);
            this.isLoading = false;
            this.notificationService.error('Error de Autenticación', 'No se pudo iniciar sesión con Google');
          }
        });
      });
    }
  }

  // --- LÓGICA DE EMAIL / PASS (Estaba perfecta, solo añadí logs) ---
  onSubmit() {
    if (this.loginData.email && this.loginData.password) {
      // Usuario admin de prueba (solo en frontend)
      if (this.loginData.email === 'admin@test.com' && this.loginData.password === '123456') {
        console.log('✅ Login con usuario admin de prueba');
        this.authService.loginTestAdmin();
        this.isLoading = false;
        this.close.emit();
        this.router.navigate(['/dashboard']);
        return;
      }

      this.isLoading = true;

      this.authService.login(this.loginData.email, this.loginData.password).subscribe({
        next: () => {
          console.log('✅ Login exitoso');
          this.isLoading = false;
          this.close.emit();
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('❌ Error en login:', err);
          this.notificationService.error('Credenciales Incorrectas', 'Email o contraseña incorrectos');
        },
      });
    }
  }

  onForgotPassword() {
    if (!this.loginData.email) {
      this.showErrorModal = true;
      this.modalMessage = 'Por favor, escribe tu email en la casilla primero para poder enviarte el enlace de recuperación.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.authService.forgotPassword(this.loginData.email).subscribe({
      next: (res) => {
        console.log('✅ Solicitud de recuperación enviada:', res);
        this.isLoading = false;
        this.showSuccessModal = true;
        this.modalEmail = this.loginData.email;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error en recuperación:', err);
        this.isLoading = false;
        this.showErrorModal = true;
        this.modalMessage = 'Error al enviar el correo de recuperación. Intenta de nuevo.';
        this.cdr.detectChanges();
      }
    });
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
  }

  closeErrorModal() {
    this.showErrorModal = false;
  }
}