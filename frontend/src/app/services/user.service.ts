import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Cache local de usuarios
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();
  private loaded = false;

  constructor() {
    // Cargar usuarios al iniciar el servicio
    // this.loadUsers(); // 👈 Eliminado: Evita llamada 401 Unauthorized al inicio. Los componentes llamarán a loadUsers/refreshUsers cuando sea necesario.
  }

  private loadUsers() {
    if (this.loaded) return; // Evitar múltiples cargas
    this.refreshUsers();
  }

  public clearState() {
    this.loaded = false;
    this.usersSubject.next([]);
  }

  public refreshUsers() {
    this.http.get<any[]>(`${this.apiUrl}/users`).subscribe({
      next: (users) => {
        // Mapear datos del backend al modelo frontend
        const mappedUsers = users.map((u) => ({
          id: u.id,
          username: u.email.split('@')[0],
          fullName: u.fullName || u.nombre,
          email: u.email,
          role: u.role || 'user',
          status: u.status || 'inactive',
          lastLogin: u.lastLogin || u.last_login,
          telefono: u.telefono,
          direccion: u.direccion,
          fecha_nacimiento: u.fecha_nacimiento,
          dispositivo_mac: u.dispositivo_mac,
          dispositivo_nombre: u.dispositivo_nombre // Optional but good to have
        }));
        this.usersSubject.next(mappedUsers);
        this.loaded = true;
      },
      error: (err) => console.error('Error cargando usuarios:', err),
    });
  }

  getAllUsers(): Observable<User[]> {
    // Lazy loading: solo cargar si no se ha cargado antes
    if (!this.loaded) {
      this.refreshUsers();
    }
    return this.users$;
  }

  getUserById(id: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  createUser(user: User): Observable<boolean> {
    // TODO: Implementar POST al backend cuando esté disponible
    console.log('Crear usuario aún no implementado en el backend');
    return new Observable((observer) => {
      observer.next(false);
      observer.complete();
    });
  }

  updateUser(id: string | number, updatedUser: Partial<User>): Observable<any> {
    // Si se está actualizando el rol, usar el endpoint de admin
    if (updatedUser.role) {
      return this.http.put(`${this.apiUrl}/users/${id}/admin`, {
        name: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role
      });
    }
    
    // Para otras actualizaciones, usar el endpoint normal
    return this.http.put(`${this.apiUrl}/users/${id}`, updatedUser);
  }

  deleteUser(id: string | number, role: string = 'user'): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}?role=${role}`);
  }

  assignDevice(userId: number, macAddress: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/device`, { macAddress });
  }
}
