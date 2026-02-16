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
  dispositivo_mac?: string; // MAC del dispositivo asignado (solo pacientes)
  is_admin?: boolean; // Viene de la tabla cuidadores
  token?: string;
  // Campos adicionales para perfil de paciente
  edad?: number;
  genero?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  foto_perfil?: string; // URL de la foto de perfil en Cloudinary
}
