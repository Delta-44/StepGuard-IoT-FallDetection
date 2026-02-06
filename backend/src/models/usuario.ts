import pool, { query } from '../config/database';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  fecha_nacimiento?: Date;
  direccion?: string;
  telefono?: string;
  dispositivo_mac?: string; // MAC address del dispositivo asignado
  fecha_creacion?: Date;
  password_last_changed_at?: Date;
}

export const UsuarioModel = {
  /**
   * Crear un nuevo usuario
   */
  create: async (
    nombre: string,
    email: string,
    password_hash: string,
    fecha_nacimiento?: Date,
    direccion?: string,
    telefono?: string,
    dispositivo_mac?: string
  ): Promise<Usuario> => {
    const result = await query(
      'INSERT INTO usuarios (nombre, email, password_hash, fecha_nacimiento, direccion, telefono, dispositivo_mac) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [nombre, email, password_hash, fecha_nacimiento, direccion, telefono, dispositivo_mac]
    );
    return result.rows[0];
  },

  /**
   * Buscar usuario por email
   */
  findByEmail: async (email: string): Promise<Usuario | null> => {
    const result = await query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  /**
   * Buscar usuario por ID
   */
  findById: async (id: number): Promise<Usuario | null> => {
    const result = await query(
      'SELECT * FROM usuarios WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Buscar usuario por MAC del dispositivo
   */
  findByDispositivo: async (macAddress: string): Promise<Usuario | null> => {
    const result = await query(
      'SELECT * FROM usuarios WHERE dispositivo_mac = $1',
      [macAddress]
    );
    return result.rows[0] || null;
  },

  /**
   * Listar todos los usuarios
   */
  findAll: async (): Promise<Usuario[]> => {
    const result = await query('SELECT * FROM usuarios ORDER BY fecha_creacion DESC');
    return result.rows;
  },

  /**
   * Obtener cuidadores asignados a un usuario
   */
  getCuidadoresAsignados: async (usuarioId: number): Promise<any[]> => {
    const result = await query(
      `SELECT c.* FROM cuidadores c
       INNER JOIN usuario_cuidador uc ON c.id = uc.cuidador_id
       WHERE uc.usuario_id = $1`,
      [usuarioId]
    );
    return result.rows;
  },

  /**
   * Asignar dispositivo a usuario
   */
  asignarDispositivo: async (usuarioId: number, macAddress: string): Promise<Usuario | null> => {
    const result = await query(
      'UPDATE usuarios SET dispositivo_mac = $1 WHERE id = $2 RETURNING *',
      [macAddress, usuarioId]
    );
    return result.rows[0] || null;
  },

  /**
   * Desasignar dispositivo de usuario
   */
  desasignarDispositivo: async (usuarioId: number): Promise<Usuario | null> => {
    const result = await query(
      'UPDATE usuarios SET dispositivo_mac = NULL WHERE id = $1 RETURNING *',
      [usuarioId]
    );
    return result.rows[0] || null;
  },

  /**
   * Actualizar usuario
   */
  update: async (
    id: number,
    nombre: string,
    email: string,
    fecha_nacimiento?: Date,
    direccion?: string,
    telefono?: string
  ): Promise<Usuario | null> => {
    const result = await query(
      'UPDATE usuarios SET nombre = $1, email = $2, fecha_nacimiento = $3, direccion = $4, telefono = $5 WHERE id = $6 RETURNING *',
      [nombre, email, fecha_nacimiento, direccion, telefono, id]
    );
    return result.rows[0] || null;
  },

  /**
   * Eliminar usuario
   */
  delete: async (id: number): Promise<boolean> => {
    const result = await query('DELETE FROM usuarios WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },



  /**
   * Actualizar contraseña
   */
  updatePassword: async (id: number, passwordHash: string): Promise<Usuario | null> => {
    const result = await query(
      'UPDATE usuarios SET password_hash = $1, password_last_changed_at = NOW() WHERE id = $2 RETURNING *',
      [passwordHash, id]
    );
    return result.rows[0] || null;
  },

  /**
   * Buscar usuario por ID con información del dispositivo
   */
  findByIdWithDevice: async (id: number): Promise<any | null> => {
    const result = await query(
      `SELECT u.*, 
              d.mac_address as dispositivo_mac,
              d.nombre as dispositivo_nombre,
              d.estado as dispositivo_estado,
              d.total_impactos as dispositivo_total_impactos
       FROM usuarios u
       LEFT JOIN dispositivos d ON u.dispositivo_mac = d.mac_address
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },
};
