import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  error: string = '';
  success: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Obtener el token de los query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.error = 'Token inválido o no proporcionado';
      }
    });
  }

  onSubmit() {
    this.error = '';

    // Validaciones
    if (!this.newPassword || !this.confirmPassword) {
      this.error = 'Por favor, completa todos los campos';
      return;
    }

    if (this.newPassword.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.isLoading = true;

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (res) => {
        console.log('✅ Contraseña actualizada:', res);
        this.isLoading = false;
        this.success = true;
        
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      },
      error: (err) => {
        console.error('❌ Error al resetear contraseña:', err);
        this.isLoading = false;
        this.error = err.error?.message || 'Error al actualizar la contraseña. El token puede estar expirado.';
      }
    });
  }
}
