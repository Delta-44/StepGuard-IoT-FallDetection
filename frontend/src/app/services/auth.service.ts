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

  // --- LOGIN CON GOOGLE ---
  async loginWithGoogle(): Promise<User> {
    console.log('🔄 Conectando con Google (Simulado)...');
    
    // Simulamos el tiempo que tarda la ventanita de Google (1.5 segundos)
    return new Promise<User>((resolve) => {
      setTimeout(() => {
        // Creamos un usuario ficticio que "viene" de Google
        const googleUser: User = {
          id: 'google-12345',
          username: 'usuariogoogle',
          fullName: 'Usuario Google',
          email: 'usuario@gmail.com',
          role: 'user',
          status: 'active',
          lastLogin: new Date()
        };

        resolve(googleUser);
      }, 1500);
    });
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

  // =========================================================
  // 🧠 LÓGICA INTELIGENTE Y SIMULADA (MODIFICADA)
  // =========================================================
  private mockLoginLogic(email: string, pass: string): { token: string; user: User } {

    // 1. Detectamos el ROL analizando el texto del email
    let role: 'admin' | 'caregiver' | 'user' = 'user'; // Por defecto "Usuario"

    if (email.toLowerCase().includes('admin')) {
      role = 'admin';
    } else if (email.toLowerCase().includes('enfermero') ||
      email.toLowerCase().includes('hospital') ||
      email.toLowerCase().includes('cuidador')) {
      role = 'caregiver';
    }

    // 2. Asignamos un nombre bonito según el rol detectado
    let fullName = 'Usuario Anónimo';
    if (role === 'admin') fullName = 'Super Admin';
    else if (role === 'caregiver') fullName = 'Enfermero Juan';
    else fullName = 'Ana García'; // Nombre para el usuario de prueba

    // 3. Creamos el usuario simulado (Mock)
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9), // ID aleatorio
      username: email.split('@')[0],
      fullName: fullName,
      email: email,
      role: role, // <--- AQUÍ ES DONDE OCURRE LA MAGIA
      status: 'active',
      lastLogin: new Date(),
      is_admin: role === 'admin',
      telefono: '+34 600 000 000',
      ...(role === 'user' && {
        fecha_nacimiento: '1946-01-15',
        direccion: 'Calle Mayor 123, Madrid'
      })
    };

    // 4. ¡Éxito siempre! (Para facilitar tus pruebas)
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