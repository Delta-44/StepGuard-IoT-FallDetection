import pool, { query } from '../config/database';

export interface Dispositivo {
  mac_address: string; // macAddress del ESP32 (PK)
  nombre: string; // name del ESP32
  estado: boolean; // status del ESP32 (true=activo, false=inactivo)
  total_impactos: number; // impact_count del ESP32
  ultima_magnitud?: number; // impact_magnitude del ESP32
  fecha_registro?: Date;
  ultima_conexion?: Date; // timestamp del ESP32
}

export const DispositivoModel = {
  /**
   * Crear un nuevo dispositivo
   */
  create: async (
    mac_address: string,
    nombre: string
  ): Promise<Dispositivo> => {
    const result = await query(
      `INSERT INTO dispositivos 
       (mac_address, nombre) 
       VALUES ($1, $2) RETURNING *`,
      [mac_address, nombre]
    );
    return result.rows[0];
  },



  /**
   * Buscar dispositivo por MAC address
   */
  findByMac: async (mac_address: string): Promise<Dispositivo | null> => {
    const result = await query(
      'SELECT * FROM dispositivos WHERE mac_address = $1',
      [mac_address]
    );
    return result.rows[0] || null;
  },

  /**
   * Buscar dispositivo por dirección MAC
   */
  findByMacAddress: async (mac_address: string): Promise<Dispositivo | null> => {
    const result = await query(
      'SELECT * FROM dispositivos WHERE mac_address = $1',
      [mac_address]
    );
    return result.rows[0] || null;
  },

  /**
   * Listar todos los dispositivos
   */
  findAll: async (): Promise<Dispositivo[]> => {
    const result = await query('SELECT * FROM dispositivos ORDER BY fecha_registro DESC');
    return result.rows;
  },

  /**
   * Listar todos los dispositivos con usuario asignado
   */
  findAllWithUser: async (): Promise<any[]> => {
    const result = await query(`
      SELECT d.*, u.nombre as assignedUser 
      FROM dispositivos d
      LEFT JOIN usuarios u ON d.mac_address = u.dispositivo_mac
      ORDER BY d.fecha_registro DESC
    `);
    return result.rows;
  },

  /**
   * Listar dispositivos activos o inactivos
   */
  findByEstado: async (estado: boolean): Promise<Dispositivo[]> => {
    const result = await query(
      'SELECT * FROM dispositivos WHERE estado = $1',
      [estado]
    );
    return result.rows;
  },

  /**
   * Actualizar estado del dispositivo por MAC
   */
  updateEstado: async (mac_address: string, estado: boolean): Promise<Dispositivo | null> => {
    const result = await query(
      'UPDATE dispositivos SET estado = $1, ultima_conexion = CURRENT_TIMESTAMP WHERE mac_address = $2 RETURNING *',
      [estado, mac_address]
    );
    return result.rows[0] || null;
  },

  /**
   * Actualizar datos del ESP32 (impact_count y magnitude)
   */
  actualizarDatosESP32: async (mac_address: string, impact_count: number, impact_magnitude?: number): Promise<Dispositivo | null> => {
    const result = await query(
      'UPDATE dispositivos SET total_impactos = $1, ultima_magnitud = $2, ultima_conexion = CURRENT_TIMESTAMP, estado = true WHERE mac_address = $3 RETURNING *',
      [impact_count, impact_magnitude, mac_address]
    );
    return result.rows[0] || null;
  },

  /**
   * Actualizar información básica del dispositivo
   */
  update: async (
    mac_address: string,
    nombre: string
  ): Promise<Dispositivo | null> => {
    const result = await query(
      'UPDATE dispositivos SET nombre = $1 WHERE mac_address = $2 RETURNING *',
      [nombre, mac_address]
    );
    return result.rows[0] || null;
  },

  /**
   * Actualizar última conexión por MAC
   */
  updateUltimaConexion: async (mac_address: string): Promise<boolean> => {
    const result = await query(
      'UPDATE dispositivos SET ultima_conexion = CURRENT_TIMESTAMP WHERE mac_address = $1',
      [mac_address]
    );
    return (result.rowCount ?? 0) > 0;
  },

  /**
   * Obtener usuario asignado al dispositivo
   */
  getUsuarioAsignado: async (mac_address: string): Promise<any | null> => {
    const result = await query(
      'SELECT u.* FROM usuarios u WHERE u.dispositivo_mac = $1',
      [mac_address]
    );
    return result.rows[0] || null;
  },

  /**
   * Eliminar dispositivo
   */
  delete: async (mac_address: string): Promise<boolean> => {
    const result = await query('DELETE FROM dispositivos WHERE mac_address = $1', [mac_address]);
    return (result.rowCount ?? 0) > 0;
  },
};
