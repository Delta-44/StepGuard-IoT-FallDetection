import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // 👈 Necesario
import { Router } from '@angular/router';
import { Observable, of, tap, catchError } from 'rxjs'; // 👈 Añadido tap
import { User } from '../models/user.model';
import { environment } from '../../environments/environment'; // 👈 Tu URL del paso 1

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

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
      tap(res => {
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
          fullName: backendUser.name, // Mapeamos name -> fullName
          email: backendUser.email,
          role: role,
          status: 'active',
          token: res.token,
          telefono: backendUser.telefono,
          is_admin: backendUser.role === 'admin'
        };

        this.saveSession(userToSave, res.token);
      })
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

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('stepguard_session');
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  // Helper para el login con Google
  getGoogleLoginUrl(): string {
    return `${this.apiUrl}/auth/google`;
  }


  loginWithGoogle(googleToken: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/google`, { token: googleToken }).pipe(
      tap(res => {
        // El backend validará el token de Google y te devolverá SU propio token
        const backendUser = res.user;

        // Mapear el rol correctamente
        let role: 'admin' | 'caregiver' | 'user' = 'user';
        if (backendUser.role === 'admin') role = 'admin';
        else if (backendUser.role === 'cuidador') role = 'caregiver';
        else if (backendUser.role === 'usuario') role = 'user';

        const userToSave: User = {
          id: backendUser.id,
          username: backendUser.email.split('@')[0],
          fullName: backendUser.name || backendUser.nombre,
          email: backendUser.email,
          role: role,
          status: 'active',
          token: res.token,
          telefono: backendUser.telefono,
          is_admin: backendUser.role === 'admin'
        };

        this.saveSession(userToSave, res.token);
      })
    );
  }
}