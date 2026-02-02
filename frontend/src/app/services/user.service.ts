import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor() { }

  // MOCK: Obtener todos los usuarios del sistema
  getAllUsers(): Observable<User[]> {
    const mockUsers: User[] = [
      { 
        id: '1', 
        username: 'admin', 
        fullName: 'Super Admin', 
        role: 'admin', 
        email: 'admin@stepguard.com',
        status: 'active' 
      },
      { 
        id: '2', 
        username: 'enfermero1', 
        fullName: 'Juan López', 
        role: 'caregiver', 
        email: 'juan@hospital.com',
        status: 'active',
        lastLogin: new Date(Date.now() - 86400000)
      },
      { 
        id: '3', 
        username: 'paciente_ana', 
        fullName: 'Ana García', 
        role: 'user', 
        email: 'ana.familia@gmail.com',
        status: 'inactive'
      }
    ];
    return of(mockUsers).pipe(delay(500));
  }

  // MOCK: Borrar un usuario
  deleteUser(id: string): Observable<boolean> {
    console.log(`🗑️ Eliminando usuario con ID: ${id}`);
    return of(true).pipe(delay(500));
  }

  // SIMULACIÓN: Crear usuario nuevo
  createUser(user: User): Observable<User> {
    console.log('📡 Enviando al backend:', user);
    // Devolvemos el mismo usuario simulando que el servidor respondió OK
    return of(user).pipe(delay(500)); 
  }
}
