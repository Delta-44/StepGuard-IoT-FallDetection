import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Estado reactivo con Signal (Más moderno)
  public currentUser = signal<User | null>(null);

  constructor(private router: Router) {
    // SOLO cargar sesión si hay token válido
    const token = localStorage.getItem('auth_token');
    const saved = localStorage.getItem('mock_session');
    
    if (token && saved) {
      try {
        this.currentUser.set(JSON.parse(saved));
      } catch {
        // Si hay error al parsear, limpiar todo
        this.clearSession();
      }
    } else {
      // Si no hay token o sesión, limpiar todo
      this.clearSession();
    }
  }

  private clearSession(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('mock_session');
    this.currentUser.set(null);
  }

  // --- LOGIN: Ahora devuelve un Token falso ---
  login(email: string, password: string): Observable<{ token: string; user: User }> {
    // Simulamos retardo de red
    return of(this.mockLoginLogic(email, password)).pipe(delay(1000));
  }

  // --- REGISTRO: Nuevo método ---
  register(data: { name: string; email: string; password: string }): Observable<{ token: string; user: User }> {
    console.log('Registrando usuario:', data);
    // Simulamos éxito siempre
    const newUser: User = { id: 'new-1', username: data.name, role: 'user', fullName: data.name, email: data.email };
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

  // --- LÓGICA DE LOGIN SIMULADA (Privada) ---
  private mockLoginLogic(email: string, pass: string): { token: string; user: User } {
    // Validaciones "Hardcodeadas" para pruebas
    if (email === 'admin@test.com' && pass === '123456') {
      return { 
        token: 'fake-admin-token', 
        user: { id: '1', username: 'admin', role: 'admin', fullName: 'Super Admin', email } 
      };
    } 
    if (email === 'cuidador@test.com' && pass === '123456') {
      return { 
        token: 'fake-caregiver-token', 
        user: { id: '2', username: 'cuidador', role: 'caregiver', fullName: 'Enfermero Juan', email } 
      };
    }
    
    // Si falla, lanzamos error (para que el catchError del componente salte)
    throw { error: { message: 'Credenciales inválidas (Prueba admin@test.com / 123456)' } };
  }

  logout(): void {
    localStorage.removeItem('mock_session');
    localStorage.removeItem('auth_token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}