import { query } from '../config/database';

export interface Notificacion {
  id: number;
  evento_id?: number;
  cuidador_id: number;
  tipo: 'email' | 'sms' | 'push' | 'app';
  estado: 'pendiente' | 'enviada' | 'entregada' | 'leida' | 'fallida';
  asunto?: string;
  contenido?: string;
  fecha_envio?: Date;
  fecha_entrega?: Date;
  fecha_lectura?: Date;
  error_mensaje?: string;
  intentos_envio: number;
}

export const NotificacionModel = {
  /**
   * Crear una nueva notificación
   */
  create: async (
    cuidador_id: number,
    tipo: 'email' | 'sms' | 'push' | 'app',
    asunto: string,
    contenido: string,
    evento_id?: number
  ): Promise<Notificacion> => {
    const result = await query(
      `INSERT INTO notificaciones 
       (evento_id, cuidador_id, tipo, asunto, contenido) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [evento_id, cuidador_id, tipo, asunto, contenido]
    );
    return result.rows[0];
  },

  /**
   * Buscar notificación por ID
   */
  findById: async (id: number): Promise<Notificacion | null> => {
    const result = await query(
      'SELECT * FROM notificaciones WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Obtener notificaciones de un cuidador
   */
  findByCuidador: async (
    cuidador_id: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notificacion[]> => {
    const result = await query(
      `SELECT n.*, ec.severidad as evento_severidad, u.nombre as usuario_nombre
       FROM notificaciones n
       LEFT JOIN eventos_caida ec ON n.evento_id = ec.id
       LEFT JOIN usuarios u ON ec.usuario_id = u.id
       WHERE n.cuidador_id = $1
       ORDER BY n.fecha_envio DESC
       LIMIT $2 OFFSET $3`,
      [cuidador_id, limit, offset]
    );
    return result.rows;
  },

  /**
   * Obtener notificaciones no leídas de un cuidador
   */
  findNoLeidas: async (cuidador_id: number): Promise<Notificacion[]> => {
    const result = await query(
      `SELECT n.*, ec.severidad as evento_severidad, u.nombre as usuario_nombre
       FROM notificaciones n
       LEFT JOIN eventos_caida ec ON n.evento_id = ec.id
       LEFT JOIN usuarios u ON ec.usuario_id = u.id
       WHERE n.cuidador_id = $1 AND n.fecha_lectura IS NULL
       ORDER BY n.fecha_envio DESC`,
      [cuidador_id]
    );
    return result.rows;
  },

  /**
   * Obtener notificaciones de un evento específico
   */
  findByEvento: async (evento_id: number): Promise<Notificacion[]> => {
    const result = await query(
      `SELECT n.*, c.nombre as cuidador_nombre, c.email as cuidador_email
       FROM notificaciones n
       LEFT JOIN cuidadores c ON n.cuidador_id = c.id
       WHERE n.evento_id = $1
       ORDER BY n.fecha_envio DESC`,
      [evento_id]
    );
    return result.rows;
  },

  /**
   * Marcar notificación como enviada
   */
  marcarEnviada: async (id: number): Promise<Notificacion | null> => {
    const result = await query(
      `UPDATE notificaciones 
       SET estado = 'enviada', 
           fecha_envio = CURRENT_TIMESTAMP,
           intentos_envio = intentos_envio + 1
       WHERE id = $1 
       RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Marcar notificación como entregada
   */
  marcarEntregada: async (id: number): Promise<Notificacion | null> => {
    const result = await query(
      `UPDATE notificaciones 
       SET estado = 'entregada', 
           fecha_entrega = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Marcar notificación como leída
   */
  marcarLeida: async (id: number): Promise<Notificacion | null> => {
    const result = await query(
      `UPDATE notificaciones 
       SET estado = 'leida', 
           fecha_lectura = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Marcar notificación como fallida
   */
  marcarFallida: async (id: number, error_mensaje: string): Promise<Notificacion | null> => {
    const result = await query(
      `UPDATE notificaciones 
       SET estado = 'fallida', 
           error_mensaje = $1,
           intentos_envio = intentos_envio + 1
       WHERE id = $2 
       RETURNING *`,
      [error_mensaje, id]
    );
    return result.rows[0] || null;
  },

  /**
   * Marcar múltiples notificaciones como leídas
   */
  marcarVariasLeidas: async (ids: number[]): Promise<number> => {
    const result = await query(
      `UPDATE notificaciones 
       SET estado = 'leida', 
           fecha_lectura = CURRENT_TIMESTAMP
       WHERE id = ANY($1::int[])`,
      [ids]
    );
    return result.rowCount ?? 0;
  },

  /**
   * Obtener notificaciones pendientes de envío
   */
  findPendientes: async (limit: number = 100): Promise<Notificacion[]> => {
    const result = await query(
      `SELECT * FROM notificaciones 
       WHERE estado = 'pendiente' AND intentos_envio < 3
       ORDER BY fecha_envio ASC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  /**
   * Obtener estadísticas de notificaciones
   */
  getEstadisticas: async (cuidador_id?: number): Promise<any> => {
    let queryText = `
      SELECT 
        COUNT(*) as total_notificaciones,
        COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
        COUNT(*) FILTER (WHERE estado = 'enviada') as enviadas,
        COUNT(*) FILTER (WHERE estado = 'leida') as leidas,
        COUNT(*) FILTER (WHERE estado = 'fallida') as fallidas,
        COUNT(*) FILTER (WHERE fecha_lectura IS NULL) as no_leidas,
        AVG(EXTRACT(EPOCH FROM (fecha_lectura - fecha_envio))) FILTER (WHERE fecha_lectura IS NOT NULL) as tiempo_lectura_promedio
      FROM notificaciones
    `;

    const params: any[] = [];
    if (cuidador_id) {
      queryText += ' WHERE cuidador_id = $1';
      params.push(cuidador_id);
    }

    const result = await query(queryText, params);
    return result.rows[0];
  },

  /**
   * Reintentar envío de notificación fallida
   */
  reintentar: async (id: number): Promise<Notificacion | null> => {
    const result = await query(
      `UPDATE notificaciones 
       SET estado = 'pendiente', 
           error_mensaje = NULL
       WHERE id = $1 AND estado = 'fallida' AND intentos_envio < 3
       RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Eliminar notificación
   */
  delete: async (id: number): Promise<boolean> => {
    const result = await query('DELETE FROM notificaciones WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  /**
   * Limpiar notificaciones antiguas (más de 90 días)
   */
  limpiarAntiguas: async (dias: number = 90): Promise<number> => {
    const result = await query(
      `DELETE FROM notificaciones 
       WHERE fecha_envio < NOW() - INTERVAL '${dias} days'`,
      []
    );
    return result.rowCount ?? 0;
  },
};
