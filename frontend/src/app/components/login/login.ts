import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'; // <--- OJO AQUÍ
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink], // Importante importar esto
  templateUrl: './login.html',
  // Si usas el CSS de referencia, asegúrate de tener Tailwind, si no, déjalo vacío
  styleUrl: './login.css' 
})
export class LoginComponent {
  // Inyección de dependencias moderna
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  // Signals para estado de la UI
  loading = signal(false);
  error = signal<string | null>(null);

  // Formulario Reactivo
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  submit() {
    this.error.set(null); // Limpiar errores previos

    if (this.form.invalid) {
      this.form.markAllAsTouched(); // Mostrar errores rojos si faltan campos
      return;
    }

    const { email, password } = this.form.getRawValue();

    this.loading.set(true); // Activar spinner
    
    // Llamada al servicio
    this.auth.login(email, password).pipe(
      tap(response => {
        this.auth.saveToken(response.token);
        this.auth.saveSession(response.user);
      }),
      tap(() => this.loading.set(false)),
      tap(() => this.router.navigate(['/dashboard'])), // Redirigir al dashboard
      catchError((err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Error de conexión');
        return of(null);
      })
    ).subscribe();
  }
}