import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de Redis para datos de dispositivos ESP32
const redisConfig: any = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

// TLS automático solo para servicios que lo requieren (puerto 6380 o URLs específicas)
// Redis Cloud con puertos estándar (no 6380) NO usa TLS
if (process.env.REDIS_PORT === '6380' || 
    (process.env.REDIS_HOST?.includes('upstash.io') && process.env.REDIS_PORT === '6380')) {
  redisConfig.tls = { rejectUnauthorized: false };
}

const redis = new Redis(redisConfig);

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
   * @param macAddress - MAC del dispositivo (ej: "FF:FF:FF:FF:FF:FF")
   * @param data - Datos del sensor
   */
  setDeviceData: async (macAddress: string, data: any) => {
    const key = `device:${macAddress}`;
    await redis.set(key, JSON.stringify(data), 'EX', 3600); // Expira en 1 hora
    return true;
  },

  /**
   * Obtener datos del dispositivo ESP32
   * @param macAddress - MAC del dispositivo
   */
  getDeviceData: async (macAddress: string) => {
    const key = `device:${macAddress}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Guardar historial de lecturas (últimas N lecturas)
   * @param macAddress - MAC del dispositivo
   * @param data - Datos del sensor
   * @param maxEntries - Máximo de entradas a mantener (por defecto 100)
   */
  addDeviceHistory: async (macAddress: string, data: any, maxEntries: number = 100) => {
    const key = `history:${macAddress}`;
    const timestamp = Date.now();
    const entry = JSON.stringify({ ...data, timestamp });
    
    await redis.lpush(key, entry);
    await redis.ltrim(key, 0, maxEntries - 1); // Mantener solo las últimas N entradas
    await redis.expire(key, 86400); // Expira en 24 horas
    return true;
  },

  /**
   * Obtener historial de lecturas
   * @param macAddress - MAC del dispositivo
   * @param count - Número de entradas a obtener (por defecto 10)
   */
  getDeviceHistory: async (macAddress: string, count: number = 10) => {
    const key = `history:${macAddress}`;
    const history = await redis.lrange(key, 0, count - 1);
    return history.map(entry => JSON.parse(entry));
  },

  /**
   * Guardar alerta de caída detectada
   * @param macAddress - MAC del dispositivo
   * @param data - Datos de la alerta
   */
  setFallAlert: async (macAddress: string, data: any) => {
    const key = `alert:${macAddress}`;
    const timestamp = Date.now();
    await redis.zadd('fall_alerts', timestamp, JSON.stringify({ macAddress, ...data, timestamp }));
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
   * @param macAddress - MAC del dispositivo
   * @param status - Estado (boolean: true=online, false=offline)
   */
  setDeviceStatus: async (macAddress: string, status: boolean) => {
    const key = `status:${macAddress}`;
    const statusStr = status ? 'online' : 'offline';
    await redis.set(key, statusStr, 'EX', 300); // Expira en 5 minutos
    return true;
  },

  /**
   * Obtener estado de conexión del dispositivo
   * @param macAddress - MAC del dispositivo
   */
  getDeviceStatus: async (macAddress: string) => {
    const key = `status:${macAddress}`;
    const status = await redis.get(key);
    return status === 'online'; // Return boolean
  },

  /**
   * Eliminar todos los datos de un dispositivo
   * @param macAddress - MAC del dispositivo
   */
  clearDeviceData: async (macAddress: string) => {
    const keys = await redis.keys(`*:${macAddress}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  },
};

export default redis;
