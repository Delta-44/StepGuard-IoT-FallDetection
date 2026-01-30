import pool, { query } from '../config/database';

export interface Cuidador {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  telefono?: string;
  is_admin: boolean;
  fecha_creacion?: Date;
}

export const CuidadorModel = {
  /**
   * Crear un nuevo cuidador
   */
  create: async (nombre: string, email: string, password_hash: string, telefono?: string, is_admin: boolean = false): Promise<Cuidador> => {
    const result = await query(
      'INSERT INTO cuidadores (nombre, email, password_hash, telefono, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, email, password_hash, telefono, is_admin]
    );
    return result.rows[0];
  },

  /**
   * Buscar cuidador por email
   */
  findByEmail: async (email: string): Promise<Cuidador | null> => {
    const result = await query(
      'SELECT * FROM cuidadores WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  /**
   * Buscar cuidador por ID
   */
  findById: async (id: number): Promise<Cuidador | null> => {
    const result = await query(
      'SELECT * FROM cuidadores WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Listar todos los cuidadores
   */
  findAll: async (): Promise<Cuidador[]> => {
    const result = await query('SELECT * FROM cuidadores ORDER BY fecha_creacion DESC');
    return result.rows;
  },

  /**
   * Obtener usuarios asignados a un cuidador
   */
  getUsuariosAsignados: async (cuidadorId: number): Promise<any[]> => {
    const result = await query(
      `SELECT u.* FROM usuarios u
       INNER JOIN usuario_cuidador uc ON u.id = uc.usuario_id
       WHERE uc.cuidador_id = $1`,
      [cuidadorId]
    );
    return result.rows;
  },

  /**
   * Asignar un usuario a un cuidador
   */
  asignarUsuario: async (cuidadorId: number, usuarioId: number): Promise<boolean> => {
    try {
      await query(
        'INSERT INTO usuario_cuidador (usuario_id, cuidador_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [usuarioId, cuidadorId]
      );
      return true;
    } catch (error) {
      console.error('Error asignando usuario a cuidador:', error);
      return false;
    }
  },

  /**
   * Desasignar un usuario de un cuidador
   */
  desasignarUsuario: async (cuidadorId: number, usuarioId: number): Promise<boolean> => {
    const result = await query(
      'DELETE FROM usuario_cuidador WHERE usuario_id = $1 AND cuidador_id = $2',
      [usuarioId, cuidadorId]
    );
    return (result.rowCount ?? 0) > 0;
  },

  /**
   * Actualizar cuidador
   */
  update: async (id: number, nombre: string, email: string, telefono?: string): Promise<Cuidador | null> => {
    const result = await query(
      'UPDATE cuidadores SET nombre = $1, email = $2, telefono = $3 WHERE id = $4 RETURNING *',
      [nombre, email, telefono, id]
    );
    return result.rows[0] || null;
  },

  /**
   * Actualizar estado de admin de un cuidador
   */
  setAdmin: async (id: number, is_admin: boolean): Promise<Cuidador | null> => {
    const result = await query(
      'UPDATE cuidadores SET is_admin = $1 WHERE id = $2 RETURNING *',
      [is_admin, id]
    );
    return result.rows[0] || null;
  },

  /**
   * Listar todos los administradores
   */
  findAdmins: async (): Promise<Cuidador[]> => {
    const result = await query(
      'SELECT * FROM cuidadores WHERE is_admin = true ORDER BY fecha_creacion DESC'
    );
    return result.rows;
  },

  /**
   * Verificar si un cuidador es admin
   */
  isAdmin: async (id: number): Promise<boolean> => {
    const result = await query(
      'SELECT is_admin FROM cuidadores WHERE id = $1',
      [id]
    );
    return result.rows[0]?.is_admin || false;
  },

  /**
   * Eliminar cuidador
   */
  delete: async (id: number): Promise<boolean> => {
    const result = await query('DELETE FROM cuidadores WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
