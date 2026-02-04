import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  
  // 👇 CLAVE PARA GUARDAR EN EL NAVEGADOR
  private readonly STORAGE_KEY = 'stepguard_users';

  // Datos iniciales (Solo se usan la primera vez que abres la app)
  private initialUsers: User[] = [
    { id: 1, fullName: 'Pepito Pérez', email: 'pepito@test.com', role: 'user', status: 'active', username: 'pepito123' },
    { id: 2, fullName: 'Super Admin', email: 'admin@test.com', role: 'admin', status: 'active', username: 'admin' },
    { id: 3, fullName: 'Enfermera Laura', email: 'laura@test.com', role: 'caregiver', status: 'active', username: 'laura_nurse' }
  ];

  // Inicializamos el Subject vacío, los datos se cargarán en el constructor
  private usersSubject = new BehaviorSubject<User[]>([]);
  
  users$ = this.usersSubject.asObservable();

  constructor() { 
    // 👇 AL INICIAR EL SERVICIO, CARGAMOS DEL DISCO DURO
    this.loadFromStorage();
  }

  // --- MÉTODOS PRIVADOS DE PERSISTENCIA ---

  private loadFromStorage() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    
    if (saved) {
      // ✅ Si hay datos guardados, usamos esos
      this.usersSubject.next(JSON.parse(saved));
    } else {
      // ⚠️ Si es la primera vez, usamos los iniciales y los guardamos
      this.usersSubject.next(this.initialUsers);
      this.saveToStorage(this.initialUsers);
    }
  }

  private saveToStorage(users: User[]) {
    // 💾 Guardamos en el navegador y actualizamos la app
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    this.usersSubject.next(users);
  }

  // --- MÉTODOS PÚBLICOS (CRUD) ---

  getAllUsers(): Observable<User[]> {
    return this.users$;
  }

  createUser(user: User): Observable<boolean> {
    // Usamos getValue() para obtener el estado actual
    const currentUsers = this.usersSubject.getValue();
    
    // Calculamos ID asegurando que sean números
    const maxId = currentUsers.length > 0 
      ? Math.max(...currentUsers.map(u => Number(u.id))) 
      : 0;

    const newId = maxId + 1;
    
    const newUser: User = { 
      ...user, 
      id: newId, 
      status: 'active' 
    };
    
    const updatedUsers = currentUsers.concat(newUser);
    
    // 👇 GUARDAMOS EN MEMORIA PERSISTENTE
    this.saveToStorage(updatedUsers);
    
    return new Observable(observer => {
      observer.next(true);
      observer.complete();
    });
  }

  updateUser(id: string | number, updatedUser: User): Observable<boolean> {
    const currentUsers = this.usersSubject.getValue();
    // Usamos == para que '1' sea igual a 1
    const index = currentUsers.findIndex(u => u.id == id);
    
    if (index !== -1) {
      const updatedList = [...currentUsers];
      // Mantenemos el ID original
      updatedList[index] = { ...updatedUser, id: Number(id) };
      
      // 👇 GUARDAMOS EN MEMORIA PERSISTENTE
      this.saveToStorage(updatedList);
      
      return new Observable(obs => { obs.next(true); obs.complete(); });
    }
    return new Observable(obs => { obs.next(false); obs.complete(); });
  }

  deleteUser(id: string | number): Observable<boolean> {
    const currentUsers = this.usersSubject.getValue();
    const filteredUsers = currentUsers.filter(u => u.id != id);
    
    // 👇 GUARDAMOS EN MEMORIA PERSISTENTE
    this.saveToStorage(filteredUsers);
    
    return new Observable(obs => { obs.next(true); obs.complete(); });
  }
}