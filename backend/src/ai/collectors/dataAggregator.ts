/**
 * Agregador de datos
 * Combina datos de Redis y PostgreSQL
 */

import { redisCollector } from './redisCollector';
import { postgresCollector } from './postgresCollector';
import { logger } from '../utils/logger';
import { TIME_WINDOWS } from '../config';
import type { AggregatedData, SensorData, HistoricalEvent } from '../types';

export class DataAggregator {
  /**
   * Agrega datos completos de un dispositivo
   */
  async aggregateDeviceData(
    deviceId: string,
    deviceIdNum: number,
    timeWindowMinutes: number = 60
  ): Promise<any> {
    try {
      const startTime = Date.now();
      
      // Obtener datos en paralelo
      const [
        realtimeData,
        realtimeHistory,
        historicalStats,
        historicalEvents,
      ] = await Promise.all([
        redisCollector.getDeviceData(deviceId),
        redisCollector.getDeviceHistory(deviceId, 100),
        postgresCollector.getDeviceStats(deviceIdNum, 7),
        postgresCollector.getDeviceEvents(
          deviceIdNum,
          new Date(Date.now() - timeWindowMinutes * 60 * 1000)
        ),
      ]);

      const result = {
        deviceId,
        timestamp: new Date(),
        realtime: {
          current: realtimeData,
          history: realtimeHistory,
          status: await redisCollector.getDeviceStatus(deviceId),
        },
        historical: {
          stats: historicalStats,
          events: historicalEvents,
        },
        aggregated: this.calculateAggregatedMetrics(realtimeHistory, historicalEvents),
        metadata: {
          processingTime: Date.now() - startTime,
          dataQuality: this.assessDataQuality(realtimeHistory, historicalEvents),
        },
      };

      logger.debug(`Aggregated data for device ${deviceId}`, {
        realtimeSamples: realtimeHistory.length,
        historicalEvents: historicalEvents.length,
      });

      return result;
    } catch (error) {
      logger.error(`Error aggregating device data for ${deviceId}`, error);
      throw error;
    }
  }

  /**
   * Agrega datos completos de un usuario
   */
  async aggregateUserData(userId: number, days: number = 30): Promise<any> {
    try {
      const startTime = Date.now();

      // Obtener datos del usuario en paralelo
      const [
        userInfo,
        userStats,
        userEvents,
        temporalPatterns,
      ] = await Promise.all([
        postgresCollector.getUserInfo(userId),
        postgresCollector.getUserStats(userId, days),
        postgresCollector.getUserEvents(
          userId,
          new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        ),
        postgresCollector.getTemporalPatterns(userId, days),
      ]);

      const result = {
        userId,
        userInfo,
        timestamp: new Date(),
        statistics: userStats,
        events: userEvents,
        patterns: {
          temporal: temporalPatterns,
          behavioral: this.analyzeBehavioralPatterns(userEvents),
        },
        insights: this.generateQuickInsights(userStats, userEvents, temporalPatterns),
        metadata: {
          processingTime: Date.now() - startTime,
          dataQuality: this.assessDataQuality([], userEvents),
          period: {
            days,
            start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
            end: new Date(),
          },
        },
      };

      logger.debug(`Aggregated data for user ${userId}`, {
        eventCount: userEvents.length,
        patternCount: temporalPatterns.length,
      });

      return result;
    } catch (error) {
      logger.error(`Error aggregating user data for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Combina datos de sensores en tiempo real con datos históricos
   */
  async combineData(
    realtimeData: SensorData[],
    historicalEvents: HistoricalEvent[]
  ): Promise<any[]> {
    // Convertir eventos históricos a formato común
    const historicalSensorData = historicalEvents.map(event => ({
      deviceId: event.dispositivo_id.toString(),
      timestamp: event.fecha_hora,
      acc_x: event.acc_x,
      acc_y: event.acc_y,
      acc_z: event.acc_z,
      isFallDetected: event.severidad !== 'low',
    }));

    // Combinar y ordenar por timestamp
    const combined = [...realtimeData, ...historicalSensorData];
    combined.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return combined;
  }

  /**
   * Calcula métricas agregadas
   */
  private calculateAggregatedMetrics(
    realtimeData: SensorData[],
    historicalEvents: HistoricalEvent[]
  ): any {
    const allMagnitudes: number[] = [];

    // Calcular magnitudes de datos en tiempo real
    realtimeData.forEach(data => {
      const magnitude = Math.sqrt(
        data.acc_x ** 2 + data.acc_y ** 2 + data.acc_z ** 2
      );
      allMagnitudes.push(magnitude);
    });

    // Calcular magnitudes de eventos históricos
    historicalEvents.forEach(event => {
      const magnitude = Math.sqrt(
        event.acc_x ** 2 + event.acc_y ** 2 + event.acc_z ** 2
      );
      allMagnitudes.push(magnitude);
    });

    if (allMagnitudes.length === 0) {
      return {
        avgMagnitude: 0,
        maxMagnitude: 0,
        minMagnitude: 0,
        variance: 0,
        sampleCount: 0,
      };
    }

    const avg = allMagnitudes.reduce((a, b) => a + b, 0) / allMagnitudes.length;
    const variance = allMagnitudes.reduce((sum, val) => 
      sum + Math.pow(val - avg, 2), 0
    ) / allMagnitudes.length;

    return {
      avgMagnitude: avg,
      maxMagnitude: Math.max(...allMagnitudes),
      minMagnitude: Math.min(...allMagnitudes),
      variance,
      sampleCount: allMagnitudes.length,
    };
  }

  /**
   * Evalúa la calidad de los datos
   */
  private assessDataQuality(
    realtimeData: SensorData[],
    historicalEvents: HistoricalEvent[]
  ): number {
    let quality = 1.0;

    // Penalizar si hay muy pocos datos
    const totalSamples = realtimeData.length + historicalEvents.length;
    if (totalSamples < 10) {
      quality *= 0.5;
    } else if (totalSamples < 50) {
      quality *= 0.7;
    }

    // Penalizar si hay muchos valores cero o inválidos
    const invalidRealtime = realtimeData.filter(d => 
      d.acc_x === 0 && d.acc_y === 0 && d.acc_z === 0
    ).length;
    
    if (realtimeData.length > 0) {
      const invalidRatio = invalidRealtime / realtimeData.length;
      quality *= (1 - invalidRatio * 0.5);
    }

    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Analiza patrones de comportamiento
   */
  private analyzeBehavioralPatterns(events: HistoricalEvent[]): any {
    if (events.length === 0) {
      return {
        fallFrequency: 0,
        avgSeverity: 0,
        responsePattern: 'insufficient_data',
      };
    }

    // Calcular frecuencia de caídas
    const timeSpan = 
      (events[0].fecha_hora.getTime() - events[events.length - 1].fecha_hora.getTime()) / 
      (1000 * 60 * 60 * 24); // días
    
    const fallFrequency = events.length / Math.max(1, timeSpan);

    // Calcular severidad promedio
    const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
    const avgSeverity = events.reduce((sum, e) => 
      sum + (severityMap[e.severidad] || 0), 0
    ) / events.length;

    // Analizar patrón de respuesta
    const attended = events.filter(e => e.estado === 'atendida').length;
    const falseAlarms = events.filter(e => e.estado === 'falsa_alarma').length;
    const ignored = events.filter(e => e.estado === 'ignorada').length;

    let responsePattern = 'good';
    if (falseAlarms / events.length > 0.3) {
      responsePattern = 'high_false_alarms';
    } else if (ignored / events.length > 0.2) {
      responsePattern = 'low_engagement';
    } else if (attended / events.length > 0.8) {
      responsePattern = 'excellent';
    }

    return {
      fallFrequency,
      avgSeverity,
      responsePattern,
      distribution: {
        attended,
        falseAlarms,
        ignored,
        pending: events.filter(e => e.estado === 'pendiente').length,
      },
    };
  }

  /**
   * Genera insights rápidos
   */
  private generateQuickInsights(
    stats: any,
    events: HistoricalEvent[],
    temporalPatterns: any[]
  ): string[] {
    const insights: string[] = [];

    if (!stats) return insights;

    // Insight sobre frecuencia
    if (stats.totalEvents > 10) {
      insights.push(`Usuario tiene ${stats.totalEvents} eventos registrados`);
    }

    // Insight sobre falsas alarmas
    if (stats.falseAlarmRate > 0.3) {
      insights.push(`Tasa alta de falsas alarmas (${(stats.falseAlarmRate * 100).toFixed(1)}%)`);
    }

    // Insight sobre tiempo de respuesta
    if (stats.avgResponseTime && stats.avgResponseTime < 300) {
      insights.push('Tiempo de respuesta excelente (< 5 minutos)');
    } else if (stats.avgResponseTime > 900) {
      insights.push('Tiempo de respuesta puede mejorar (> 15 minutos)');
    }

    // Insight sobre patrones temporales
    if (temporalPatterns.length > 0) {
      const maxPattern = temporalPatterns.reduce((max, p) => 
        p.fallCount > max.fallCount ? p : max
      );
      insights.push(`Mayor actividad en hora ${maxPattern.hour}:00`);
    }

    return insights;
  }
}

export const dataAggregator = new DataAggregator();
