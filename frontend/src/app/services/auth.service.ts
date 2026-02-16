import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap, catchError, delay } from 'rxjs';
import { User } from '../models/user.model';
import { UserService } from './user.service'; // 👈 Importamos UserService
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;
  // Force git detect

  public currentUser = signal<User | null>(null);

  constructor() {
    // Intentar recuperar sesión real al recargar
    const saved = localStorage.getItem('stepguard_session');
    if (saved) {
      this.currentUser.set(JSON.parse(saved));
    }
  }

  // --- LOGIN REAL ---
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((res) => {
        // Adaptamos la respuesta del backend a tu modelo de User
        // Res viene como { message, token, user: { id, email, name, role } }
        const backendUser = res.user;

        // El backend ahora envía el rol directamente: 'admin', 'cuidador', 'usuario'
        let role: 'admin' | 'caregiver' | 'user' = 'user';
        if (backendUser.role === 'admin') role = 'admin';
        else if (backendUser.role === 'cuidador') role = 'caregiver';
        else if (backendUser.role === 'usuario') role = 'user';

        const userToSave: User = {
          id: backendUser.id,
          username: backendUser.email.split('@')[0],
          fullName: backendUser.fullName || backendUser.nombre || backendUser.name, 
          email: backendUser.email,
          role: role,
          status: 'active',
          token: res.token,
          telefono: backendUser.telefono,
          is_admin: backendUser.role === 'admin',
          foto_perfil: backendUser.foto_perfil,
        };

        this.saveSession(userToSave, res.token);
      }),
    );
  }

  // --- REGISTRO REAL (CUIDADOR O PACIENTE) ---
  register(data: any, type: 'usuario' | 'cuidador'): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register/${type}`, data);
  }

  // --- GESTIÓN DE SESIÓN ---
  private saveSession(user: User, token: string): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('stepguard_session', JSON.stringify(user));
    this.currentUser.set(user);
  }

  private userService = inject(UserService); // 👈 Inyectamos UserService para limpiar estado

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('stepguard_session');
    this.currentUser.set(null);
    this.userService.clearState(); // 👈 Limpiar cache de usuarios al salir
    this.router.navigate(['/']);
  }

  updateCurrentUser(user: any) {
    this.currentUser.set(user);
    localStorage.setItem('stepguard_session', JSON.stringify(user)); // Update the stored session
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Helper para el login con Google
  getGoogleLoginUrl(): string {
    return `${this.apiUrl}/auth/google`;
  }

  loginWithGoogle(googleToken: string, role?: string): Observable<any> {
    const payload: any = { token: googleToken };
    if (role) {
      payload.role = role;
    }

    return this.http.post<any>(`${this.apiUrl}/auth/google`, payload).pipe(
      tap((res) => {
        // Si es un usuario nuevo, el backend devolverá isNewUser: true
        if (res.isNewUser) {
          // El frontend debe manejar esto mostrando un selector de rol
          return;
        }

        // El backend validará el token de Google y te devolverá SU propio token
        const backendUser = res.user;

        if (!backendUser) {
          throw new Error('No user data received from backend');
        }

        // Mapear el rol correctamente
        let userRole: 'admin' | 'caregiver' | 'user' = 'user';
        if (backendUser.role === 'admin') userRole = 'admin';
        else if (backendUser.role === 'cuidador') userRole = 'caregiver';
        else if (backendUser.role === 'usuario') userRole = 'user';

        const userToSave: User = {
          id: backendUser.id,
          username: backendUser.email.split('@')[0],
          fullName: backendUser.name || backendUser.nombre,
          email: backendUser.email,
          role: userRole,
          status: 'active',
          token: res.token,
          telefono: backendUser.telefono,
          is_admin: backendUser.role === 'admin',
          foto_perfil: backendUser.foto_perfil,
        };

        this.saveSession(userToSave, res.token);
      }),
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/reset-password`, { token, password });
  }
  loginTestAdmin(): void {
    const testAdmin: User = {
      id: 'test-admin-1',
      username: 'admin',
      fullName: 'Administrador de Prueba',
      email: 'admin@test.com',
      role: 'admin',
      status: 'active',
      token: 'test-token-' + Date.now(),
      telefono: '000000000',
      is_admin: true,
    };

    this.saveSession(testAdmin, testAdmin.token || 'test-token');
  }
}
