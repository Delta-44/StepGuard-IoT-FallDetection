/**
 * Recolector de datos desde PostgreSQL (Neon)
 * Obtiene datos históricos y estadísticas
 */

import { query } from '../../config/database';
import { logger } from '../utils/logger';
import type { HistoricalEvent, AggregatedData } from '../types';

export class PostgresCollector {
  /**
   * Obtiene eventos de caída de un dispositivo en un rango de fechas
   */
  async getDeviceEvents(
    deviceId: number,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<HistoricalEvent[]> {
    try {
      let queryText = `
        SELECT * FROM eventos_caida 
        WHERE dispositivo_id = $1
      `;
      const params: any[] = [deviceId];

      if (startDate) {
        params.push(startDate);
        queryText += ` AND fecha_hora >= $${params.length}`;
      }

      if (endDate) {
        params.push(endDate);
        queryText += ` AND fecha_hora <= $${params.length}`;
      }

      queryText += ` ORDER BY fecha_hora DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      logger.error(`Error getting device events for device ${deviceId}`, error);
      return [];
    }
  }

  /**
   * Obtiene eventos de caída de un usuario
   */
  async getUserEvents(
    userId: number,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<HistoricalEvent[]> {
    try {
      let queryText = `
        SELECT * FROM eventos_caida 
        WHERE usuario_id = $1
      `;
      const params: any[] = [userId];

      if (startDate) {
        params.push(startDate);
        queryText += ` AND fecha_hora >= $${params.length}`;
      }

      if (endDate) {
        params.push(endDate);
        queryText += ` AND fecha_hora <= $${params.length}`;
      }

      queryText += ` ORDER BY fecha_hora DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await query(queryText, params);
      return result.rows;
    } catch (error) {
      logger.error(`Error getting user events for user ${userId}`, error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas agregadas de un dispositivo
   */
  async getDeviceStats(deviceId: number, days: number = 7): Promise<AggregatedData | null> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await query(
        `
        SELECT 
          COUNT(*) as total_falls,
          COUNT(*) FILTER (WHERE estado = 'atendida') as confirmed_falls,
          COUNT(*) FILTER (WHERE estado = 'falsa_alarma') as false_alarms,
          AVG(acc_x) as avg_acc_x,
          AVG(acc_y) as avg_acc_y,
          AVG(acc_z) as avg_acc_z,
          MAX(SQRT(acc_x*acc_x + acc_y*acc_y + acc_z*acc_z)) as max_magnitude,
          STDDEV(SQRT(acc_x*acc_x + acc_y*acc_y + acc_z*acc_z)) as variance,
          MIN(fecha_hora) as first_event,
          MAX(fecha_hora) as last_event
        FROM eventos_caida
        WHERE dispositivo_id = $1 
          AND fecha_hora >= $2
        `,
        [deviceId, startDate]
      );

      if (result.rows.length === 0 || result.rows[0].total_falls === '0') {
        return null;
      }

      const row = result.rows[0];
      const endDate = new Date();
      const duration = (endDate.getTime() - startDate.getTime()) / 1000 / 60; // minutos

      return {
        deviceId: deviceId.toString(),
        timeWindow: {
          start: startDate,
          end: endDate,
          duration,
        },
        sensorStats: {
          avgAccX: parseFloat(row.avg_acc_x) || 0,
          avgAccY: parseFloat(row.avg_acc_y) || 0,
          avgAccZ: parseFloat(row.avg_acc_z) || 0,
          maxMagnitude: parseFloat(row.max_magnitude) || 0,
          variance: parseFloat(row.variance) || 0,
          sampleCount: parseInt(row.total_falls) || 0,
        },
        eventStats: {
          totalFalls: parseInt(row.total_falls) || 0,
          confirmedFalls: parseInt(row.confirmed_falls) || 0,
          falseAlarms: parseInt(row.false_alarms) || 0,
          avgSeverity: 0, // TODO: Calcular promedio de severidad
        },
      };
    } catch (error) {
      logger.error(`Error getting device stats for device ${deviceId}`, error);
      return null;
    }
  }

  /**
   * Obtiene estadísticas agregadas de un usuario
   */
  async getUserStats(userId: number, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await query(
        `
        SELECT 
          COUNT(*) as total_events,
          COUNT(*) FILTER (WHERE estado = 'atendida') as attended_events,
          COUNT(*) FILTER (WHERE estado = 'falsa_alarma') as false_alarms,
          COUNT(DISTINCT dispositivo_id) as device_count,
          AVG(CASE 
            WHEN severidad = 'low' THEN 1
            WHEN severidad = 'medium' THEN 2
            WHEN severidad = 'high' THEN 3
            WHEN severidad = 'critical' THEN 4
            ELSE 0
          END) as avg_severity,
          AVG(
            EXTRACT(EPOCH FROM (fecha_atencion - fecha_hora))
          ) FILTER (WHERE fecha_atencion IS NOT NULL) as avg_response_time
        FROM eventos_caida
        WHERE usuario_id = $1 
          AND fecha_hora >= $2
        `,
        [userId, startDate]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];

      return {
        userId,
        totalEvents: parseInt(row.total_events) || 0,
        attendedEvents: parseInt(row.attended_events) || 0,
        falseAlarms: parseInt(row.false_alarms) || 0,
        deviceCount: parseInt(row.device_count) || 0,
        avgSeverity: parseFloat(row.avg_severity) || 0,
        avgResponseTime: parseFloat(row.avg_response_time) || 0, // segundos
        falseAlarmRate: row.total_events > 0 
          ? parseFloat(row.false_alarms) / parseFloat(row.total_events) 
          : 0,
        period: {
          start: startDate,
          end: new Date(),
          days,
        },
      };
    } catch (error) {
      logger.error(`Error getting user stats for user ${userId}`, error);
      return null;
    }
  }

  /**
   * Obtiene patrones temporales de caídas (por hora del día)
   */
  async getTemporalPatterns(userId: number, days: number = 30): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await query(
        `
        SELECT 
          EXTRACT(HOUR FROM fecha_hora) as hour,
          COUNT(*) as fall_count,
          AVG(CASE 
            WHEN severidad = 'low' THEN 1
            WHEN severidad = 'medium' THEN 2
            WHEN severidad = 'high' THEN 3
            WHEN severidad = 'critical' THEN 4
            ELSE 0
          END) as avg_severity
        FROM eventos_caida
        WHERE usuario_id = $1 
          AND fecha_hora >= $2
        GROUP BY EXTRACT(HOUR FROM fecha_hora)
        ORDER BY hour
        `,
        [userId, startDate]
      );

      return result.rows.map(row => ({
        hour: parseInt(row.hour),
        fallCount: parseInt(row.fall_count),
        avgSeverity: parseFloat(row.avg_severity),
      }));
    } catch (error) {
      logger.error(`Error getting temporal patterns for user ${userId}`, error);
      return [];
    }
  }

  /**
   * Obtiene información del dispositivo
   */
  async getDeviceInfo(deviceId: number): Promise<any> {
    try {
      const result = await query(
        `SELECT * FROM dispositivos WHERE id = $1`,
        [deviceId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error getting device info for device ${deviceId}`, error);
      return null;
    }
  }

  /**
   * Obtiene información del usuario
   */
  async getUserInfo(userId: number): Promise<any> {
    try {
      const result = await query(
        `SELECT id, nombre, email, telefono, edad FROM usuarios WHERE id = $1`,
        [userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error getting user info for user ${userId}`, error);
      return null;
    }
  }

  /**
   * Obtiene todos los usuarios activos (con eventos recientes)
   */
  async getActiveUsers(days: number = 30): Promise<number[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await query(
        `
        SELECT DISTINCT usuario_id 
        FROM eventos_caida 
        WHERE fecha_hora >= $1 
          AND usuario_id IS NOT NULL
        ORDER BY usuario_id
        `,
        [startDate]
      );

      return result.rows.map(row => row.usuario_id);
    } catch (error) {
      logger.error('Error getting active users', error);
      return [];
    }
  }
}

export const postgresCollector = new PostgresCollector();
