import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  // 1. ACTUALIZAMOS LOS DATOS MOCK PARA QUE COINCIDAN CON LA NUEVA INTERFAZ
  private mockUsers: User[] = [
    { 
      id: '1', 
      username: 'admin', 
      fullName: 'Super Admin', 
      role: 'admin', 
      email: 'admin@stepguard.com',
      status: 'active',
      is_admin: true,
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
      is_admin: false,
      telefono: '+34 611 222 333'
    },
    { 
      id: '3', 
      username: 'paciente_ana', 
      fullName: 'Ana García', 
      role: 'user', 
      email: 'ana.familia@gmail.com',
      status: 'inactive',
      // ✨ CAMBIO: Quitamos edad, ponemos fecha (YYYY-MM-DD para que el input lo lea bien)
      fecha_nacimiento: '1946-05-15', 
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
      fecha_nacimiento: '1942-11-20', // ✨ CAMBIO
      direccion: 'Av. Libertad 45',
      telefono: '+34 699 888 777'
    }
  ];

  constructor() { }

  getAllUsers(): Observable<User[]> {
    return of(this.mockUsers).pipe(delay(500));
  }

  deleteUser(id: string | number): Observable<boolean> {
    console.log(`🗑️ Eliminando usuario con ID: ${id}`);
    const initialLength = this.mockUsers.length;
    this.mockUsers = this.mockUsers.filter(u => u.id !== id);
    return of(this.mockUsers.length < initialLength).pipe(delay(500));
  }

  createUser(user: User): Observable<User> {
    const newUser = { 
      ...user, 
      id: Math.floor(Math.random() * 1000).toString(),
      status: 'active' as const 
    };
    this.mockUsers.push(newUser);
    return of(newUser).pipe(delay(800)); 
  }

  // --- EDITAR USUARIO ---
  updateUser(id: string | number, updatedData: User): Observable<User> {
    console.log(`📝 Editando usuario ${id}:`, updatedData);
    const index = this.mockUsers.findIndex(u => u.id === id);
    
    if (index !== -1) {
      this.mockUsers[index] = { 
        ...this.mockUsers[index], 
        ...updatedData,
        id: this.mockUsers[index].id 
      };
      return of(this.mockUsers[index]).pipe(delay(500));
    }
    return throwError(() => new Error('Usuario no encontrado'));
  }
}