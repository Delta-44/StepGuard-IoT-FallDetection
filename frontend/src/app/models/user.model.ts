export interface User {
  id: string | number;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'caregiver' | 'user';
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date;
  telefono?: string;
  direccion?: string; // Solo para pacientes
  fecha_nacimiento?: string | Date; // Solo para pacientes
  is_admin?: boolean; // Viene de la tabla cuidadores
  token?: string;
}
