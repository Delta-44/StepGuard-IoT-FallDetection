import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de Redis para datos de dispositivos ESP32
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('✅ Conectado a Redis');
});

redis.on('error', (err) => {
  console.error('❌ Error en Redis:', err);
});

// Funciones helper para gestionar datos de ESP32
export const ESP32Cache = {
  /**
   * Guardar datos del dispositivo ESP32
   * @param deviceId - ID del dispositivo (ej: "ESP32-001")
   * @param data - Datos del sensor
   */
  setDeviceData: async (deviceId: string, data: any) => {
    const key = `device:${deviceId}`;
    await redis.set(key, JSON.stringify(data), 'EX', 3600); // Expira en 1 hora
    return true;
  },

  /**
   * Obtener datos del dispositivo ESP32
   * @param deviceId - ID del dispositivo
   */
  getDeviceData: async (deviceId: string) => {
    const key = `device:${deviceId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Guardar historial de lecturas (últimas N lecturas)
   * @param deviceId - ID del dispositivo
   * @param data - Datos del sensor
   * @param maxEntries - Máximo de entradas a mantener (por defecto 100)
   */
  addDeviceHistory: async (deviceId: string, data: any, maxEntries: number = 100) => {
    const key = `history:${deviceId}`;
    const timestamp = Date.now();
    const entry = JSON.stringify({ ...data, timestamp });
    
    await redis.lpush(key, entry);
    await redis.ltrim(key, 0, maxEntries - 1); // Mantener solo las últimas N entradas
    await redis.expire(key, 86400); // Expira en 24 horas
    return true;
  },

  /**
   * Obtener historial de lecturas
   * @param deviceId - ID del dispositivo
   * @param count - Número de entradas a obtener (por defecto 10)
   */
  getDeviceHistory: async (deviceId: string, count: number = 10) => {
    const key = `history:${deviceId}`;
    const history = await redis.lrange(key, 0, count - 1);
    return history.map(entry => JSON.parse(entry));
  },

  /**
   * Guardar alerta de caída detectada
   * @param deviceId - ID del dispositivo
   * @param data - Datos de la alerta
   */
  setFallAlert: async (deviceId: string, data: any) => {
    const key = `alert:${deviceId}`;
    const timestamp = Date.now();
    await redis.zadd('fall_alerts', timestamp, JSON.stringify({ deviceId, ...data, timestamp }));
    await redis.set(key, JSON.stringify({ ...data, timestamp }), 'EX', 86400); // Expira en 24 horas
    return true;
  },

  /**
   * Obtener todas las alertas recientes
   * @param fromTime - Timestamp desde el que buscar (por defecto últimas 24h)
   */
  getRecentAlerts: async (fromTime?: number) => {
    const from = fromTime || Date.now() - 86400000; // últimas 24 horas
    const alerts = await redis.zrangebyscore('fall_alerts', from, '+inf');
    return alerts.map(alert => JSON.parse(alert));
  },

  /**
   * Actualizar estado de conexión del dispositivo
   * @param deviceId - ID del dispositivo
   * @param status - Estado ('online' | 'offline')
   */
  setDeviceStatus: async (deviceId: string, status: 'online' | 'offline') => {
    const key = `status:${deviceId}`;
    await redis.set(key, status, 'EX', 300); // Expira en 5 minutos
    return true;
  },

  /**
   * Obtener estado de conexión del dispositivo
   * @param deviceId - ID del dispositivo
   */
  getDeviceStatus: async (deviceId: string) => {
    const key = `status:${deviceId}`;
    const status = await redis.get(key);
    return status || 'offline';
  },

  /**
   * Eliminar todos los datos de un dispositivo
   * @param deviceId - ID del dispositivo
   */
  clearDeviceData: async (deviceId: string) => {
    const keys = await redis.keys(`*:${deviceId}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  },
};

export default redis;
