import { Component, EventEmitter, Output, inject, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
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
  private alertService = inject(AlertService);
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
  // --- 👇 LÓGICA DE RESPUESTA DE GOOGLE ---
  // --- 👇 LÓGICA DE RESPUESTA DE GOOGLE ---
  handleGoogleLogin(response: any) {
    if (response.credential) {
      this.ngZone.run(() => {
        this.isLoading = true;
        
        this.authService.loginWithGoogle(response.credential).subscribe({
          next: (res) => {
            if (res.isNewUser) {
              // console.log('⚠️ Usuario nuevo detectado:', res.email);
              this.isLoading = false;
              
              // 🟢 MOSTRAR MODAL DE SELECCIÓN (DIFERIDO)
              // Usamos setTimeout para salir del contexto de ejecución del iframe de Google
              // y evitar el error "Cross-Origin-Opener-Policy".
              setTimeout(() => {
                this.ngZone.run(() => {
                  this.tempGoogleCredential = response.credential;
                  this.showRoleSelectionModal = true;
                  this.cdr.detectChanges();
                });
              }, 100);
              return;
            }

            // console.log('✅ Usuario existente, completando login directament');
            this.completeGoogleLogin();
          },
          error: (err) => {
            console.error('❌ Error Google:', err);
            this.isLoading = false;
            this.notificationService.error('Error de Autenticación', 'No se pudo iniciar sesión con Google');
          }
        });
      });
    } else {
        console.error('❌ No credential in Google response');
    }
  }

  // Nueva variable para guardar el token mientras selecciona rol
  tempGoogleCredential = '';
  showRoleSelectionModal = false;

  selectRole(role: 'admin' | 'caregiver' | 'user') {
    this.showRoleSelectionModal = false;
    this.isLoading = true;

    // Convertir a lo que espera el backend ('usuario', 'cuidador')
    const backendRole = role === 'user' ? 'usuario' : 'cuidador';

    this.authService.loginWithGoogle(this.tempGoogleCredential, backendRole).subscribe({
      next: (res) => {
        // console.log('✅ Google registro exitoso con rol:', backendRole);
        this.completeGoogleLogin();
      },
      error: (err) => {
        console.error('❌ Error registrando con Google:', err);
        this.isLoading = false;
        this.notificationService.error('Error de Registro', 'No se pudo completar el registro con Google');
      }
    });
  }

  cancelRoleSelection() {
    this.showRoleSelectionModal = false;
    this.tempGoogleCredential = '';
    this.isLoading = false;
  }

  private completeGoogleLogin() {
    // console.log('✅ Google Login exitoso');
    this.isLoading = false;
    this.alertService.initialize();
    this.close.emit();
    const userRole = this.authService.currentUser()?.role;
    const redirectPath = userRole === 'user' ? '/profile' : '/dashboard';
    this.router.navigate([redirectPath]);
  }



  // --- LÓGICA DE EMAIL / PASS (Estaba perfecta, solo añadí logs) ---
  onSubmit() {
    if (this.loginData.email && this.loginData.password) {
      // Usuario admin de prueba (solo en frontend)
      if (this.loginData.email === 'admin@test.com' && this.loginData.password === '123456') {
        // console.log('✅ Login con usuario admin de prueba');
        this.authService.loginTestAdmin();
        this.isLoading = false;
        this.alertService.initialize(); // Inicializar AlertService después del login
        this.close.emit();
        this.router.navigate(['/dashboard']);
        return;
      }

      this.isLoading = true;

      this.authService.login(this.loginData.email, this.loginData.password).subscribe({
        next: () => {
          // console.log('✅ Login exitoso');
          this.isLoading = false;
          this.alertService.initialize(); // Inicializar AlertService después del login
          this.close.emit();
          const userRole = this.authService.currentUser()?.role;
          const redirectPath = userRole === 'user' ? '/profile' : '/dashboard';
          this.router.navigate([redirectPath]);
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
        // console.log('✅ Solicitud de recuperación enviada:', res);
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