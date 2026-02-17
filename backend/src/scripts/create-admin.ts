import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST?.includes('neon.tech') || process.env.DB_HOST?.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined
});

async function createAdmin() {
  try {
    console.log('🔐 Creando cuidador admin...');

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('demo123', 10);

    // Insertar cuidador admin
    const result = await pool.query(
      `INSERT INTO cuidadores (nombre, email, password_hash, is_admin, fecha_creacion)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (email) 
       DO UPDATE SET 
         password_hash = EXCLUDED.password_hash,
         is_admin = EXCLUDED.is_admin,
         nombre = EXCLUDED.nombre
       RETURNING id, nombre, email, is_admin`,
      ['Admin', 'admin@test.com', hashedPassword, true]
    );

    console.log('✅ Cuidador admin creado/actualizado:');
    console.log('   ID:', result.rows[0].id);
    console.log('   Nombre:', result.rows[0].nombre);
    console.log('   Email:', result.rows[0].email);
    console.log('   Is Admin:', result.rows[0].is_admin);
    console.log('\n📧 Credenciales:');
    console.log('   Email: admin@test.com');
    console.log('   Password: demo123');

  } catch (error) {
    console.error('❌ Error creando admin:', error);
  } finally {
    await pool.end();
  }
}

createAdmin();
