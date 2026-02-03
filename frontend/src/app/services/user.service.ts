import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  // 1. MOVEMOS LOS DATOS AQUÍ (Variable de Clase)
  // Así, si borras uno, se borrará de verdad de la memoria temporal.
  private mockUsers: User[] = [
    { 
      id: '1', 
      username: 'admin', 
      fullName: 'Super Admin', 
      role: 'admin', 
      email: 'admin@stepguard.com',
      status: 'active',
      is_admin: true,       // ✨ Nuevo campo
      telefono: '+34 600 000 000'
    },
    { 
      id: '2', 
      username: 'enfermero1', 
      fullName: 'Juan López', 
      role: 'caregiver', 
      email: 'juan@hospital.com',
      status: 'active',
      lastLogin: new Date(Date.now() - 86400000),
      is_admin: false,      // ✨ Nuevo campo
      telefono: '+34 611 222 333'
    },
    { 
      id: '3', 
      username: 'paciente_ana', 
      fullName: 'Ana García', 
      role: 'user', 
      email: 'ana.familia@gmail.com',
      status: 'inactive',
      // ✨ Nuevos campos de Paciente
      edad: 78,
      direccion: 'C/ Mayor 123, 2ºA',
      telefono: '+34 912 345 678'
    },
    {
      id: '4',
      username: 'paciente_luis',
      fullName: 'Luis Rodríguez',
      role: 'user',
      email: 'luis.rod@gmail.com',
      status: 'active',
      edad: 82,
      direccion: 'Av. Libertad 45',
      telefono: '+34 699 888 777'
    }
  ];

  constructor() { }

  // --- OBTENER TODOS ---
  getAllUsers(): Observable<User[]> {
    // Devolvemos la variable de clase, no una nueva cada vez
    return of(this.mockUsers).pipe(delay(500));
  }

  // --- BORRAR ---
  deleteUser(id: string | number): Observable<boolean> {
    console.log(`🗑️ Eliminando usuario con ID: ${id}`);
    
    // Filtramos la lista para quitar el usuario (Simulación real de borrado)
    const initialLength = this.mockUsers.length;
    this.mockUsers = this.mockUsers.filter(u => u.id !== id);
    
    // Si la longitud cambió, es que borramos algo
    const success = this.mockUsers.length < initialLength;
    return of(success).pipe(delay(500));
  }

  // --- CREAR ---
  createUser(user: User): Observable<User> {
    console.log('📡 Simulando creación en backend:', user);
    
    // Le asignamos un ID falso y lo metemos en la lista
    const newUser = { 
      ...user, 
      id: Math.floor(Math.random() * 1000).toString(),
      status: 'active' as const // Forzamos tipo
    };
    
    this.mockUsers.push(newUser);
    
    return of(newUser).pipe(delay(800)); 
  }

  // --- EDITAR (Por si lo necesitas en el futuro) ---
  updateUser(id: string | number, updatedData: Partial<User>): Observable<User> {
    const index = this.mockUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      this.mockUsers[index] = { ...this.mockUsers[index], ...updatedData };
      return of(this.mockUsers[index]).pipe(delay(500));
    }
    return throwError(() => new Error('Usuario no encontrado'));
  }
}