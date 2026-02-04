/**
 * Recolector de datos desde Redis
 * Obtiene datos en tiempo real de dispositivos ESP32
 */

import { ESP32Cache, redis } from '../../config/redis';
import { logger } from '../utils/logger';
import type { SensorData } from '../types';

export class RedisCollector {
  /**
   * Obtiene los datos actuales de un dispositivo
   */
  async getDeviceData(deviceId: string): Promise<SensorData | null> {
    try {
      const data = await ESP32Cache.getDeviceData(deviceId);
      
      if (!data) {
        logger.debug(`No data found for device ${deviceId} in Redis`);
        return null;
      }

      return {
        deviceId,
        timestamp: new Date(data.timestamp || Date.now()),
        acc_x: data.acc_x || 0,
        acc_y: data.acc_y || 0,
        acc_z: data.acc_z || 0,
        isFallDetected: data.isFallDetected || false,
        temperature: data.temperature,
        humidity: data.humidity,
      };
    } catch (error) {
      logger.error(`Error getting device data from Redis for ${deviceId}`, error);
      return null;
    }
  }

  /**
   * Obtiene el historial reciente de un dispositivo
   */
  async getDeviceHistory(deviceId: string, limit: number = 100): Promise<SensorData[]> {
    try {
      const history = await ESP32Cache.getDeviceHistory(deviceId, limit);
      
      if (!history || history.length === 0) {
        logger.debug(`No history found for device ${deviceId}`);
        return [];
      }

      return history.map((item: any) => ({
        deviceId,
        timestamp: new Date(item.timestamp || Date.now()),
        acc_x: item.acc_x || 0,
        acc_y: item.acc_y || 0,
        acc_z: item.acc_z || 0,
        isFallDetected: item.isFallDetected || false,
        temperature: item.temperature,
        humidity: item.humidity,
      }));
    } catch (error) {
      logger.error(`Error getting device history from Redis for ${deviceId}`, error);
      return [];
    }
  }

  /**
   * Obtiene el estado de un dispositivo
   */
  async getDeviceStatus(deviceId: string): Promise<string> {
    try {
      const status = await ESP32Cache.getDeviceStatus(deviceId);
      return status || 'offline';
    } catch (error) {
      logger.error(`Error getting device status from Redis for ${deviceId}`, error);
      return 'unknown';
    }
  }

  /**
   * Obtiene alertas de caída activas
   */
  async getFallAlerts(deviceId?: string): Promise<any[]> {
    try {
      if (deviceId) {
        // Obtener alerta de caída desde Redis
      const alertKey = `alert:${deviceId}`;
      const alertData = await redis.get(alertKey);
      const alert = alertData ? JSON.parse(alertData) : null;
        return alert ? [alert] : [];
      }
      
      // TODO: Implementar obtención de todas las alertas
      return [];
    } catch (error) {
      logger.error('Error getting fall alerts from Redis', error);
      return [];
    }
  }

  /**
   * Obtiene todos los dispositivos activos (online en las últimas N horas)
   */
  async getActiveDevices(hoursWindow: number = 24): Promise<string[]> {
    try {
      // TODO: Implementar scan de Redis para obtener todos los dispositivos activos
      // Por ahora retornamos array vacío
      return [];
    } catch (error) {
      logger.error('Error getting active devices from Redis', error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas agregadas de Redis en una ventana de tiempo
   */
  async getRealtimeStats(deviceId: string, minutes: number = 5): Promise<any> {
    try {
      const history = await this.getDeviceHistory(deviceId, minutes * 60 / 5); // Asumiendo 1 lectura cada 5 seg
      
      if (history.length === 0) {
        return null;
      }

      const accMagnitudes = history.map(d => 
        Math.sqrt(d.acc_x ** 2 + d.acc_y ** 2 + d.acc_z ** 2)
      );

      return {
        deviceId,
        sampleCount: history.length,
        avgMagnitude: accMagnitudes.reduce((a, b) => a + b, 0) / accMagnitudes.length,
        maxMagnitude: Math.max(...accMagnitudes),
        minMagnitude: Math.min(...accMagnitudes),
        fallsDetected: history.filter(d => d.isFallDetected).length,
        lastUpdate: history[history.length - 1].timestamp,
      };
    } catch (error) {
      logger.error(`Error getting realtime stats for ${deviceId}`, error);
      return null;
    }
  }
}

export const redisCollector = new RedisCollector();
