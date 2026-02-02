import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Estado reactivo con Signal
  public currentUser = signal<User | null>(null);

  constructor(private router: Router) {
    // SOLO cargar sesión si hay token válido
    const token = localStorage.getItem('auth_token');
    const saved = localStorage.getItem('mock_session');
    
    if (token && saved) {
      try {
        this.currentUser.set(JSON.parse(saved));
      } catch {
        this.clearSession();
      }
    } else {
      this.clearSession();
    }
  }

  private clearSession(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mock_session');
    this.currentUser.set(null);
  }

  // --- LOGIN ---
  login(email: string, password: string): Observable<{ token: string; user: User }> {
    // Simulamos retardo de red
    return of(this.mockLoginLogic(email, password)).pipe(delay(1000));
  }

  // --- REGISTRO ---
  register(data: { name: string; email: string; password: string }): Observable<{ token: string; user: User }> {
    console.log('Registrando usuario:', data);
    
    const newUser: User = { 
      id: 'new-1', 
      username: data.name, 
      role: 'user', 
      fullName: data.name, 
      email: data.email,
      status: 'active',
      lastLogin: new Date()
    };

    return of({ token: 'fake-jwt-token-register', user: newUser }).pipe(delay(1000));
  }

  // --- GESTIÓN DE TOKEN ---
  saveToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  // --- GUARDAR SESIÓN COMPLETA ---
  saveSession(user: User): void {
    localStorage.setItem('mock_session', JSON.stringify(user));
    this.currentUser.set(user);
  }

  // --- URL PARA LOGIN CON GOOGLE ---
  getGoogleLoginUrl(): string {
    return 'http://localhost:3000/api/auth/google';
  }

  // --- LÓGICA DE LOGIN SIMULADA (Privada) ---
  private mockLoginLogic(email: string, pass: string): { token: string; user: User } {
    // Validaciones "Hardcodeadas"
    
    // 1. ADMIN
    if (email === 'admin@test.com' && pass === '123456') {
      return { 
        token: 'fake-admin-token', 
        user: { 
          id: '1', 
          username: 'admin', 
          role: 'admin', 
          fullName: 'Super Admin', 
          email,
          status: 'active',       // <--- AÑADIDO
          lastLogin: new Date()   // <--- AÑADIDO
        } 
      };
    } 
    
    // 2. CUIDADOR
    if (email === 'cuidador@test.com' && pass === '123456') {
      return { 
        token: 'fake-caregiver-token', 
        user: { 
          id: '2', 
          username: 'cuidador', 
          role: 'caregiver', 
          fullName: 'Enfermero Juan', 
          email,
          status: 'active',       // <--- AÑADIDO
          lastLogin: new Date()   // <--- AÑADIDO
        } 
      };
    }
    
    // Error si falla
    throw { error: { message: 'Credenciales inválidas (Prueba admin@test.com / 123456)' } };
  }

  logout(): void {
    localStorage.removeItem('mock_session');
    localStorage.removeItem('auth_token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}