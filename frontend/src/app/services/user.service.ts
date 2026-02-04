import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
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
    this.loadUsers();
  }

  private loadUsers() {
    if (this.loaded) return; // Evitar múltiples cargas
    
    this.http.get<any[]>(`${this.apiUrl}/users`).subscribe({
      next: (users) => {
        // Mapear datos del backend al modelo frontend
        const mappedUsers = users.map(u => ({
          id: u.id,
          username: u.email.split('@')[0],
          fullName: u.nombre,
          email: u.email,
          role: 'user' as const,
          status: 'active' as const,
          telefono: u.telefono,
          direccion: u.direccion,
          fecha_nacimiento: u.fecha_nacimiento
        }));
        this.usersSubject.next(mappedUsers);
        this.loaded = true;
      },
      error: (err) => console.error('Error cargando usuarios:', err)
    });
  }

  getAllUsers(): Observable<User[]> {
    // Retornar el observable directamente sin recargar
    return this.users$;
  }

  getUserById(id: string | number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  createUser(user: User): Observable<boolean> {
    // TODO: Implementar POST al backend cuando esté disponible
    console.log('Crear usuario aún no implementado en el backend');
    return new Observable(observer => {
      observer.next(false);
      observer.complete();
    });
  }

  updateUser(id: string | number, updatedUser: User): Observable<boolean> {
    // TODO: Implementar PUT al backend cuando esté disponible
    console.log('Actualizar usuario aún no implementado en el backend');
    return new Observable(obs => { obs.next(false); obs.complete(); });
  }

  deleteUser(id: string | number): Observable<boolean> {
    // TODO: Implementar DELETE al backend cuando esté disponible
    console.log('Eliminar usuario aún no implementado en el backend');
    return new Observable(obs => { obs.next(false); obs.complete(); });
  }
}