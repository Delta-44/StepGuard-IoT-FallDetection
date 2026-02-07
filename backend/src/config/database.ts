import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'stepguard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // SSL requerido para Neon y otros servicios cloud
  ssl: process.env.DB_HOST?.includes('neon.tech') || process.env.DB_HOST?.includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
  options: '-c timezone=Europe/Madrid',
});

// Test de conexión
pool.on('connect', () => {
  console.log('Conectado a PostgreSQL');
});

pool.on('error', (err: any) => {
  console.error('Error inesperado en PostgreSQL:', err);
  process.exit(-1);
});

export const query = async (text: string, params?: any[]) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Timeout para evitar que un cliente se quede bloqueado
  const timeout = setTimeout(() => {
    console.error('Cliente de base de datos no liberado después de 5 segundos');
  }, 5000);

  client.release = () => {
    clearTimeout(timeout);
    return release();
  };

  return client;
};

export default pool;
