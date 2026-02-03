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
      lastLogin: new Date(),
      
      // ✨ NUEVOS CAMPOS (Por defecto para registros nuevos)
      is_admin: false, 
      telefono: '',     // Se deja vacío para que lo rellene luego
      edad: 0,
      direccion: ''
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

  // =========================================================
  // 🧠 LÓGICA INTELIGENTE Y SIMULADA (MODIFICADA)
  // =========================================================
  private mockLoginLogic(email: string, pass: string): { token: string; user: User } {

    // 1. Detectamos el ROL
    let role: 'admin' | 'caregiver' | 'user' = 'user';
    let isAdmin = false; // Nuevo campo para la BD

    if (email.toLowerCase().includes('admin')) {
      role = 'admin';
      isAdmin = true; // <--- COHERENCIA CON TU SQL
    } else if (email.toLowerCase().includes('enfermero') ||
      email.toLowerCase().includes('hospital') ||
      email.toLowerCase().includes('cuidador')) {
      role = 'caregiver';
      isAdmin = false;
    }

    // 2. Asignamos nombre según rol
    let fullName = 'Usuario Anónimo';
    if (role === 'admin') fullName = 'Super Admin';
    else if (role === 'caregiver') fullName = 'Enfermero Juan';
    else fullName = 'Ana García';

    // 3. Creamos el usuario simulado CON LOS CAMPOS NUEVOS
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: email.split('@')[0],
      fullName: fullName,
      email: email,
      role: role,
      status: 'active',
      lastLogin: new Date(),
      
      // ✨ DATOS EXTRA (Para que coincida con user.model.ts)
      is_admin: isAdmin,
      telefono: '+34 600 000 000', 
      
      // Solo rellenamos edad/dirección si es paciente (opcional)
      ...(role === 'user' && {
        edad: 78,
        direccion: 'Calle Mayor 123, Madrid'
      })
    };

    return {
      token: 'fake-jwt-token-' + Date.now(),
      user: mockUser
    };
  }

  logout(): void {
    localStorage.removeItem('mock_session');
    localStorage.removeItem('auth_token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}