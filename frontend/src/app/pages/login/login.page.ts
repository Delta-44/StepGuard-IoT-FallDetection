import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { catchError, of, tap } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html'
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  googleUrl = this.auth.getGoogleLoginUrl();

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  submit() {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();

    this.loading.set(true);
    this.auth.login(email, password).pipe(
      tap(r => {
        this.auth.saveToken(r.token);
        this.auth.saveSession(r.user);
      }),
      tap(() => this.loading.set(false)),
      tap(() => this.router.navigate(['/dashboard'])),
      catchError((err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Login incorrecto');
        return of(null);
      })
    ).subscribe();
  }
}
