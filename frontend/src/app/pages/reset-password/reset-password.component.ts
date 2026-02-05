import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  token = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) {
      this.notificationService.error('Token Inválido', 'El enlace de recuperación es inválido o ha expirado');
      this.router.navigate(['/']);
    }
  }

  get passwordStrength(): 'weak' | 'medium' | 'strong' | '' {
    if (!this.newPassword) return '';
    
    const length = this.newPassword.length;
    const hasNumbers = /\d/.test(this.newPassword);
    const hasLetters = /[a-zA-Z]/.test(this.newPassword);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(this.newPassword);
    
    let score = 0;
    if (length >= 6) score++;
    if (length >= 8) score++;
    if (hasNumbers && hasLetters) score++;
    if (hasSpecialChars) score++;
    
    if (score <= 1) return 'weak';
    if (score <= 2) return 'medium';
    return 'strong';
  }

  get passwordStrengthText(): string {
    const strength = this.passwordStrength;
    if (!strength) return '';
    
    const texts = {
      weak: 'Débil',
      medium: 'Media',
      strong: 'Fuerte'
    };
    
    return texts[strength];
  }

  onSubmit() {
    if (this.newPassword !== this.confirmPassword) {
      this.notificationService.warning('Contraseñas no Coinciden', 'Por favor, verifica que ambas contraseñas sean idénticas');
      return;
    }

    if (this.newPassword.length < 6) {
      this.notificationService.warning('Contraseña muy Corta', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.isLoading = true;

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (response: { message: string }) => {
        this.isLoading = false;
        this.notificationService.success('Contraseña Actualizada', 'Ya puedes iniciar sesión con tu nueva contraseña');
        setTimeout(() => this.router.navigate(['/']), 2000);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.notificationService.error('Error al Actualizar', 'El token puede haber expirado. Solicita un nuevo enlace de recuperación');
        console.error('Error:', error);
      }
    });
  }
}
