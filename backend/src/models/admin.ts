/**
 * @deprecated Este modelo está deprecado desde el 30/01/2026
 * 
 * La funcionalidad de administradores ahora se gestiona mediante el campo
 * `is_admin` en la tabla `cuidadores`.
 * 
 * Usar: CuidadorModel.findAdmins(), CuidadorModel.setAdmin(), CuidadorModel.isAdmin()
 * 
 * Este archivo se mantiene comentado por compatibilidad histórica.
 */

/*
import pool, { query } from '../config/database';

export interface Admin {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  fecha_creacion?: Date;
}

export const AdminModel = {
  /**
   * Crear un nuevo administrador
   *\/
  create: async (nombre: string, email: string, password_hash: string): Promise<Admin> => {
    const result = await query(
      'INSERT INTO admins (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [nombre, email, password_hash]
    );
    return result.rows[0];
  },

  /**
   * Buscar administrador por email
   *\/
  findByEmail: async (email: string): Promise<Admin | null> => {
    const result = await query(
      'SELECT * FROM admins WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  /**
   * Buscar administrador por ID
   *\/
  findById: async (id: number): Promise<Admin | null> => {
    const result = await query(
      'SELECT * FROM admins WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Listar todos los administradores
   *\/
  findAll: async (): Promise<Admin[]> => {
    const result = await query('SELECT * FROM admins ORDER BY fecha_creacion DESC');
    return result.rows;
  },

  /**
   * Actualizar administrador
   *\/
  update: async (id: number, nombre: string, email: string): Promise<Admin | null> => {
    const result = await query(
      'UPDATE admins SET nombre = $1, email = $2 WHERE id = $3 RETURNING *',
      [nombre, email, id]
    );
    return result.rows[0] || null;
  },

  /**
   * Eliminar administrador
   *\/
  delete: async (id: number): Promise<boolean> => {
    const result = await query('DELETE FROM admins WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
*/
