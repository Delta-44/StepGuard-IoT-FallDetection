export interface User {
  id: string | number;
  username: string;
  email: string;
  fullName: string;
  
  // Mantenemos 'role' para que tu HTML no se rompa, 
  // aunque la BD use 'is_admin', el backend te lo traducirá o lo calcularemos nosotros.
  role: 'admin' | 'caregiver' | 'user'; 
  
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date;

  // ✨ NUEVOS CAMPOS (Que vienen de la nueva BD)
  telefono?: string;
  direccion?: string; // Solo para pacientes
  edad?: number;      // Solo para pacientes
  is_admin?: boolean; // Viene de la tabla cuidadores
}