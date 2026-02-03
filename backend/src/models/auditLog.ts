import { query } from '../config/database';

export interface AuditLog {
  id: number;
  tabla_afectada: string;
  accion: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ACCESS';
  registro_id?: number;
  usuario_tipo?: 'admin' | 'cuidador' | 'usuario' | 'sistema' | 'dispositivo';
  usuario_id?: number;
  usuario_email?: string;
  datos_anteriores?: any;
  datos_nuevos?: any;
  descripcion?: string;
  ip_address?: string;
  user_agent?: string;
  fecha_hora?: Date;
}

export const AuditLogModel = {
  /**
   * Crear un nuevo registro de auditoría
   */
  create: async (
    tabla_afectada: string,
    accion: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ACCESS',
    usuario_tipo: 'admin' | 'cuidador' | 'usuario' | 'sistema' | 'dispositivo',
    usuario_id?: number,
    usuario_email?: string,
    registro_id?: number,
    datos_anteriores?: any,
    datos_nuevos?: any,
    descripcion?: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<AuditLog> => {
    const result = await query(
      `INSERT INTO audit_log 
       (tabla_afectada, accion, registro_id, usuario_tipo, usuario_id, usuario_email, 
        datos_anteriores, datos_nuevos, descripcion, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        tabla_afectada,
        accion,
        registro_id,
        usuario_tipo,
        usuario_id,
        usuario_email,
        datos_anteriores ? JSON.stringify(datos_anteriores) : null,
        datos_nuevos ? JSON.stringify(datos_nuevos) : null,
        descripcion,
        ip_address,
        user_agent,
      ]
    );
    return result.rows[0];
  },

  /**
   * Registrar login de usuario
   */
  logLogin: async (
    usuario_tipo: 'admin' | 'cuidador' | 'usuario',
    usuario_id: number,
    usuario_email: string,
    ip_address?: string,
    user_agent?: string
  ): Promise<AuditLog> => {
    return AuditLogModel.create(
      'autenticacion',
      'LOGIN',
      usuario_tipo,
      usuario_id,
      usuario_email,
      undefined,
      undefined,
      { email: usuario_email },
      `Usuario ${usuario_email} inició sesión`,
      ip_address,
      user_agent
    );
  },

  /**
   * Registrar logout de usuario
   */
  logLogout: async (
    usuario_tipo: 'admin' | 'cuidador' | 'usuario',
    usuario_id: number,
    usuario_email: string,
    ip_address?: string
  ): Promise<AuditLog> => {
    return AuditLogModel.create(
      'autenticacion',
      'LOGOUT',
      usuario_tipo,
      usuario_id,
      usuario_email,
      undefined,
      undefined,
      { email: usuario_email },
      `Usuario ${usuario_email} cerró sesión`,
      ip_address
    );
  },

  /**
   * Registrar acceso a un recurso
   */
  logAccess: async (
    tabla: string,
    registro_id: number,
    usuario_tipo: 'admin' | 'cuidador' | 'usuario',
    usuario_id: number,
    descripcion: string,
    ip_address?: string
  ): Promise<AuditLog> => {
    return AuditLogModel.create(
      tabla,
      'ACCESS',
      usuario_tipo,
      usuario_id,
      undefined,
      registro_id,
      undefined,
      undefined,
      descripcion,
      ip_address
    );
  },

  /**
   * Registrar actualización de un registro
   */
  logUpdate: async (
    tabla: string,
    registro_id: number,
    datos_anteriores: any,
    datos_nuevos: any,
    usuario_tipo: 'admin' | 'cuidador' | 'usuario' | 'sistema',
    usuario_id?: number,
    usuario_email?: string,
    ip_address?: string
  ): Promise<AuditLog> => {
    return AuditLogModel.create(
      tabla,
      'UPDATE',
      usuario_tipo,
      usuario_id,
      usuario_email,
      registro_id,
      datos_anteriores,
      datos_nuevos,
      `Actualización en ${tabla} ID ${registro_id}`,
      ip_address
    );
  },

  /**
   * Registrar eliminación de un registro
   */
  logDelete: async (
    tabla: string,
    registro_id: number,
    datos_anteriores: any,
    usuario_tipo: 'admin' | 'cuidador' | 'usuario' | 'sistema',
    usuario_id?: number,
    usuario_email?: string,
    ip_address?: string
  ): Promise<AuditLog> => {
    return AuditLogModel.create(
      tabla,
      'DELETE',
      usuario_tipo,
      usuario_id,
      usuario_email,
      registro_id,
      datos_anteriores,
      undefined,
      `Eliminación en ${tabla} ID ${registro_id}`,
      ip_address
    );
  },

  /**
   * Registrar inserción de un registro
   */
  logInsert: async (
    tabla: string,
    registro_id: number,
    datos_nuevos: any,
    usuario_tipo: 'admin' | 'cuidador' | 'usuario' | 'sistema',
    usuario_id?: number,
    usuario_email?: string,
    ip_address?: string
  ): Promise<AuditLog> => {
    return AuditLogModel.create(
      tabla,
      'INSERT',
      usuario_tipo,
      usuario_id,
      usuario_email,
      registro_id,
      undefined,
      datos_nuevos,
      `Nueva entrada en ${tabla}`,
      ip_address
    );
  },

  /**
   * Buscar registro de auditoría por ID
   */
  findById: async (id: number): Promise<AuditLog | null> => {
    const result = await query(
      'SELECT * FROM audit_log WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Obtener logs por tabla afectada
   */
  findByTabla: async (
    tabla: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> => {
    const result = await query(
      `SELECT * FROM audit_log 
       WHERE tabla_afectada = $1 
       ORDER BY fecha_hora DESC 
       LIMIT $2 OFFSET $3`,
      [tabla, limit, offset]
    );
    return result.rows;
  },

  /**
   * Obtener logs por usuario
   */
  findByUsuario: async (
    usuario_tipo: string,
    usuario_id: number,
    limit: number = 100
  ): Promise<AuditLog[]> => {
    const result = await query(
      `SELECT * FROM audit_log 
       WHERE usuario_tipo = $1 AND usuario_id = $2
       ORDER BY fecha_hora DESC 
       LIMIT $3`,
      [usuario_tipo, usuario_id, limit]
    );
    return result.rows;
  },

  /**
   * Obtener logs por acción
   */
  findByAccion: async (
    accion: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ACCESS',
    limit: number = 100
  ): Promise<AuditLog[]> => {
    const result = await query(
      `SELECT * FROM audit_log 
       WHERE accion = $1 
       ORDER BY fecha_hora DESC 
       LIMIT $2`,
      [accion, limit]
    );
    return result.rows;
  },

  /**
   * Obtener logs por rango de fechas
   */
  findByFechas: async (
    fecha_inicio: Date,
    fecha_fin: Date,
    tabla?: string,
    usuario_tipo?: string
  ): Promise<AuditLog[]> => {
    let queryText = `
      SELECT * FROM audit_log 
      WHERE fecha_hora BETWEEN $1 AND $2
    `;
    const params: any[] = [fecha_inicio, fecha_fin];
    let paramIndex = 3;

    if (tabla) {
      queryText += ` AND tabla_afectada = $${paramIndex++}`;
      params.push(tabla);
    }

    if (usuario_tipo) {
      queryText += ` AND usuario_tipo = $${paramIndex++}`;
      params.push(usuario_tipo);
    }

    queryText += ' ORDER BY fecha_hora DESC';

    const result = await query(queryText, params);
    return result.rows;
  },

  /**
   * Obtener logs de logins recientes
   */
  findLoginsRecientes: async (horas: number = 24): Promise<AuditLog[]> => {
    const result = await query(
      `SELECT * FROM audit_log 
       WHERE accion = 'LOGIN' 
       AND fecha_hora > NOW() - INTERVAL '${horas} hours'
       ORDER BY fecha_hora DESC`,
      []
    );
    return result.rows;
  },

  /**
   * Obtener historial de cambios de un registro específico
   */
  findHistorialRegistro: async (
    tabla: string,
    registro_id: number
  ): Promise<AuditLog[]> => {
    const result = await query(
      `SELECT * FROM audit_log 
       WHERE tabla_afectada = $1 AND registro_id = $2
       ORDER BY fecha_hora DESC`,
      [tabla, registro_id]
    );
    return result.rows;
  },

  /**
   * Obtener estadísticas de auditoría
   */
  getEstadisticas: async (dias: number = 30): Promise<any> => {
    const result = await query(
      `SELECT 
        COUNT(*) as total_logs,
        COUNT(*) FILTER (WHERE accion = 'LOGIN') as logins,
        COUNT(*) FILTER (WHERE accion = 'LOGOUT') as logouts,
        COUNT(*) FILTER (WHERE accion = 'INSERT') as inserts,
        COUNT(*) FILTER (WHERE accion = 'UPDATE') as updates,
        COUNT(*) FILTER (WHERE accion = 'DELETE') as deletes,
        COUNT(*) FILTER (WHERE accion = 'ACCESS') as accesos,
        COUNT(DISTINCT usuario_id) as usuarios_unicos,
        COUNT(DISTINCT ip_address) as ips_unicas
      FROM audit_log
      WHERE fecha_hora > NOW() - INTERVAL '${dias} days'`,
      []
    );
    return result.rows[0];
  },

  /**
   * Buscar actividad sospechosa (múltiples intentos desde misma IP)
   */
  findActividadSospechosa: async (horas: number = 1, intentos: number = 5): Promise<any[]> => {
    const result = await query(
      `SELECT 
        ip_address,
        usuario_email,
        COUNT(*) as intentos,
        array_agg(DISTINCT accion) as acciones,
        MIN(fecha_hora) as primera_vez,
        MAX(fecha_hora) as ultima_vez
      FROM audit_log
      WHERE fecha_hora > NOW() - INTERVAL '${horas} hours'
      GROUP BY ip_address, usuario_email
      HAVING COUNT(*) > ${intentos}
      ORDER BY intentos DESC`,
      []
    );
    return result.rows;
  },

  /**
   * Limpiar logs antiguos (por defecto más de 1 año)
   */
  limpiarAntiguos: async (dias: number = 365): Promise<number> => {
    const result = await query(
      `DELETE FROM audit_log 
       WHERE fecha_hora < NOW() - INTERVAL '${dias} days'`,
      []
    );
    return result.rowCount ?? 0;
  },
};
