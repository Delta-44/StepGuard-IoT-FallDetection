// src/app/models/cuidador.model.ts

export interface Cuidador {
    id: number;           // En BD es numérico (SERIAL)
    nombre: string;
    email: string;
    telefono?: string;    // Opcional
    is_admin: boolean;    // El campo clave para distinguir Admin vs Enfermero
    fecha_creacion?: Date;
    
    // Opcional: Si en el futuro quieres manejar contraseñas desde el admin
    // (aunque por seguridad no se suele traer el hash al frontend)
    password?: string; 
}