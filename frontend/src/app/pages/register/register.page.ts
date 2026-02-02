import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of, tap } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html'
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit() {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    
    // Simulamos registro exitoso
    setTimeout(() => {
      this.loading.set(false);
      this.success.set(true);
      
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }, 1000);
  }
}
