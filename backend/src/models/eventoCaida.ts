import { query } from "../config/database";

export interface EventoCaida {
  id: number;
  dispositivo_mac: string;
  usuario_id?: number;
  fecha_hora: Date;
  acc_x?: number;
  acc_y?: number;
  acc_z?: number;
  severidad: "low" | "medium" | "high" | "critical";
  estado: "pendiente" | "atendida" | "falsa_alarma" | "ignorada";
  ubicacion?: string;
  notas?: string;
  atendido_por?: number;
  fecha_atencion?: Date;
  creado_en?: Date;
}

export const EventoCaidaModel = {
  /**
   * Registrar un nuevo evento de caída
   */
  create: async (
    dispositivo_mac: string,
    usuario_id: number | undefined,
    acc_x: number,
    acc_y: number,
    acc_z: number,
    severidad: "low" | "medium" | "high" | "critical" = "medium",
    ubicacion?: string,
    notas?: string,
  ): Promise<EventoCaida> => {
    const result = await query(
      `INSERT INTO eventos_caida 
       (dispositivo_mac, usuario_id, acc_x, acc_y, acc_z, severidad, ubicacion, notas) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        dispositivo_mac,
        usuario_id,
        acc_x,
        acc_y,
        acc_z,
        severidad,
        ubicacion,
        notas,
      ],
    );
    return result.rows[0];
  },

  /**
   * Buscar evento por ID
   */
  findById: async (id: number): Promise<EventoCaida | null> => {
    const result = await query("SELECT * FROM eventos_caida WHERE id = $1", [
      id,
    ]);
    return result.rows[0] || null;
  },

  /**
   * Marcar evento como resuelto (atendida)
   */
  markAsResolved: async (
    id: number,
    atendidoPorId: number,
  ): Promise<EventoCaida | null> => {
    const result = await query(
      `UPDATE eventos_caida 
       SET estado = 'atendida', 
           atendido_por = $1, 
           fecha_atencion = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [atendidoPorId, id],
    );
    return result.rows[0] || null;
  },

  /**
   * Marcar evento como resuelto (atendida)
   */
  markAsResolved: async (id: number, atendidoPorId: number): Promise<EventoCaida | null> => {
    const result = await query(
      `UPDATE eventos_caida 
       SET estado = 'atendida', 
           atendido_por = $1, 
           fecha_atencion = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [atendidoPorId, id]
    );
    return result.rows[0] || null;
  },

  /**
   * Obtener eventos de un usuario específico
   */
  findByUsuario: async (
    usuario_id: number,
    limit: number = 50,
    offset: number = 0,
  ): Promise<EventoCaida[]> => {
    const result = await query(
      `SELECT * FROM eventos_caida 
       WHERE usuario_id = $1 
       ORDER BY fecha_hora DESC 
       LIMIT $2 OFFSET $3`,
      [usuario_id, limit, offset],
    );
    return result.rows;
  },

  /**
   * Obtener eventos de un dispositivo específico
   */
  findByDispositivo: async (
    dispositivo_mac: string,
    limit: number = 50
  ): Promise<EventoCaida[]> => {
    const result = await query(
      `SELECT * FROM eventos_caida 
       WHERE dispositivo_mac = $1 
       ORDER BY fecha_hora DESC 
       LIMIT $2`,
      [dispositivo_mac, limit]
    );
    return result.rows;
  },

  /**
   * Obtener eventos pendientes
   */
  findPendientes: async (): Promise<EventoCaida[]> => {
    const result = await query(
      `SELECT ec.*, u.nombre as usuario_nombre, d.mac_address as device_id, ec.ubicacion as dispositivo_ubicacion
       FROM eventos_caida ec
       LEFT JOIN usuarios u ON ec.usuario_id = u.id
       LEFT JOIN dispositivos d ON ec.dispositivo_mac = d.mac_address
       WHERE ec.estado = 'pendiente'
       ORDER BY ec.severidad DESC, ec.fecha_hora DESC`,
    );
    return result.rows;
  },

  /**
   * Obtener eventos por rango de fechas
   */
  findByFechas: async (
    fecha_inicio: Date,
    fecha_fin: Date,
    usuario_id?: number,
  ): Promise<EventoCaida[]> => {
    let queryText = `
      SELECT ec.*, u.nombre as usuario_nombre, d.device_id
      FROM eventos_caida ec
      LEFT JOIN usuarios u ON ec.usuario_id = u.id
      LEFT JOIN dispositivos d ON ec.dispositivo_mac = d.mac_address
      WHERE ec.fecha_hora BETWEEN $1 AND $2
    `;
    const params: any[] = [fecha_inicio, fecha_fin];

    if (usuario_id) {
      queryText += " AND ec.usuario_id = $3";
      params.push(usuario_id);
    }

    queryText += " ORDER BY ec.fecha_hora DESC";

    const result = await query(queryText, params);
    return result.rows;
  },

  /**
   * Marcar evento como atendido
   */
  marcarAtendido: async (
    id: number,
    cuidador_id: number,
    notas?: string,
  ): Promise<EventoCaida | null> => {
    const result = await query(
      `UPDATE eventos_caida 
       SET estado = 'atendida', 
           atendido_por = $1, 
           fecha_atencion = CURRENT_TIMESTAMP,
           notas = COALESCE($2, notas)
       WHERE id = $3 
       RETURNING *`,
      [cuidador_id, notas, id],
    );
    return result.rows[0] || null;
  },

  /**
   * Marcar evento como falsa alarma
   */
  marcarFalsaAlarma: async (
    id: number,
    cuidador_id: number,
    notas?: string,
  ): Promise<EventoCaida | null> => {
    const result = await query(
      `UPDATE eventos_caida 
       SET estado = 'falsa_alarma', 
           atendido_por = $1, 
           fecha_atencion = CURRENT_TIMESTAMP,
           notas = COALESCE($2, notas)
       WHERE id = $3 
       RETURNING *`,
      [cuidador_id, notas, id],
    );
    return result.rows[0] || null;
  },

  /**
   * Actualizar estado del evento
   */
  updateEstado: async (
    id: number,
    estado: "pendiente" | "atendida" | "falsa_alarma" | "ignorada",
    notas?: string,
  ): Promise<EventoCaida | null> => {
    const result = await query(
      `UPDATE eventos_caida 
       SET estado = $1, notas = COALESCE($2, notas)
       WHERE id = $3 
       RETURNING *`,
      [estado, notas, id],
    );
    return result.rows[0] || null;
  },

  /**
   * Obtener estadísticas de eventos
   */
  getEstadisticas: async (usuario_id?: number): Promise<any> => {
    let queryText = `
      SELECT 
        COUNT(*) as total_eventos,
        COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
        COUNT(*) FILTER (WHERE estado = 'atendida') as atendidas,
        COUNT(*) FILTER (WHERE estado = 'falsa_alarma') as falsas_alarmas,
        COUNT(*) FILTER (WHERE severidad = 'critical') as criticas,
        COUNT(*) FILTER (WHERE fecha_hora > NOW() - INTERVAL '24 hours') as ultimas_24h,
        COUNT(*) FILTER (WHERE fecha_hora > NOW() - INTERVAL '7 days') as ultimos_7d
      FROM eventos_caida
    `;

    const params: any[] = [];
    if (usuario_id) {
      queryText += " WHERE usuario_id = $1";
      params.push(usuario_id);
    }

    const result = await query(queryText, params);
    return result.rows[0];
  },

  /**
   * Eliminar evento
   */
  delete: async (id: number): Promise<boolean> => {
    const result = await query("DELETE FROM eventos_caida WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
