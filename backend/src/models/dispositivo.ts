import pool, { query } from '../config/database';

export interface Dispositivo {
  id: number;
  device_id: string; // Identificador único del ESP32 (ej: "ESP32-001")
  mac_address: string;
  nombre: string;
  ubicacion?: string;
  estado: 'online' | 'offline' | 'maintenance';
  firmware_version?: string;
  sensibilidad_caida: 'low' | 'medium' | 'high';
  intervalo_reporte_ms: number;
  led_habilitado: boolean;
  fecha_registro?: Date;
  ultima_conexion?: Date;
}

export const DispositivoModel = {
  /**
   * Crear un nuevo dispositivo
   */
  create: async (
    device_id: string,
    mac_address: string,
    nombre: string,
    ubicacion?: string,
    firmware_version?: string
  ): Promise<Dispositivo> => {
    const result = await query(
      `INSERT INTO dispositivos 
       (device_id, mac_address, nombre, ubicacion, firmware_version) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [device_id, mac_address, nombre, ubicacion, firmware_version]
    );
    return result.rows[0];
  },

  /**
   * Buscar dispositivo por device_id (ej: "ESP32-001")
   */
  findByDeviceId: async (device_id: string): Promise<Dispositivo | null> => {
    const result = await query(
      'SELECT * FROM dispositivos WHERE device_id = $1',
      [device_id]
    );
    return result.rows[0] || null;
  },

  /**
   * Buscar dispositivo por ID numérico
   */
  findById: async (id: number): Promise<Dispositivo | null> => {
    const result = await query(
      'SELECT * FROM dispositivos WHERE id = $1',
      [id]
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
   * Listar dispositivos por estado
   */
  findByEstado: async (estado: 'online' | 'offline' | 'maintenance'): Promise<Dispositivo[]> => {
    const result = await query(
      'SELECT * FROM dispositivos WHERE estado = $1',
      [estado]
    );
    return result.rows;
  },

  /**
   * Actualizar estado del dispositivo
   */
  updateEstado: async (device_id: string, estado: 'online' | 'offline' | 'maintenance'): Promise<Dispositivo | null> => {
    const result = await query(
      'UPDATE dispositivos SET estado = $1, ultima_conexion = CURRENT_TIMESTAMP WHERE device_id = $2 RETURNING *',
      [estado, device_id]
    );
    return result.rows[0] || null;
  },

  /**
   * Actualizar configuración del dispositivo
   */
  updateConfig: async (
    device_id: string,
    sensibilidad_caida?: 'low' | 'medium' | 'high',
    intervalo_reporte_ms?: number,
    led_habilitado?: boolean
  ): Promise<Dispositivo | null> => {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (sensibilidad_caida !== undefined) {
      updates.push(`sensibilidad_caida = $${paramIndex++}`);
      values.push(sensibilidad_caida);
    }
    if (intervalo_reporte_ms !== undefined) {
      updates.push(`intervalo_reporte_ms = $${paramIndex++}`);
      values.push(intervalo_reporte_ms);
    }
    if (led_habilitado !== undefined) {
      updates.push(`led_habilitado = $${paramIndex++}`);
      values.push(led_habilitado);
    }

    if (updates.length === 0) return null;

    values.push(device_id);
    const queryText = `UPDATE dispositivos SET ${updates.join(', ')} WHERE device_id = $${paramIndex} RETURNING *`;

    const result = await query(queryText, values);
    return result.rows[0] || null;
  },

  /**
   * Actualizar información básica del dispositivo
   */
  update: async (
    id: number,
    nombre: string,
    ubicacion?: string,
    firmware_version?: string
  ): Promise<Dispositivo | null> => {
    const result = await query(
      'UPDATE dispositivos SET nombre = $1, ubicacion = $2, firmware_version = $3 WHERE id = $4 RETURNING *',
      [nombre, ubicacion, firmware_version, id]
    );
    return result.rows[0] || null;
  },

  /**
   * Actualizar última conexión
   */
  updateUltimaConexion: async (device_id: string): Promise<boolean> => {
    const result = await query(
      'UPDATE dispositivos SET ultima_conexion = CURRENT_TIMESTAMP WHERE device_id = $1',
      [device_id]
    );
    return (result.rowCount ?? 0) > 0;
  },

  /**
   * Obtener usuario asignado al dispositivo
   */
  getUsuarioAsignado: async (dispositivoId: number): Promise<any | null> => {
    const result = await query(
      'SELECT u.* FROM usuarios u WHERE u.dispositivo_id = $1',
      [dispositivoId]
    );
    return result.rows[0] || null;
  },

  /**
   * Eliminar dispositivo
   */
  delete: async (id: number): Promise<boolean> => {
    const result = await query('DELETE FROM dispositivos WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
