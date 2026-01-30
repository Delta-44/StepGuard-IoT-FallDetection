import pool, { query } from './config/database';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script para inicializar la base de datos remota
 * Ejecuta el archivo init.sql en la base de datos PostgreSQL
 */
async function initDatabase() {
  console.log('🚀 Iniciando configuración de base de datos...\n');
  console.log(`📊 Conectando a: ${process.env.DB_HOST}`);
  console.log(`📦 Base de datos: ${process.env.DB_NAME}\n`);

  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'database', 'init.sql');
    console.log(`📄 Leyendo archivo SQL: ${sqlPath}`);
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`No se encontró el archivo init.sql en ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    console.log('✅ Archivo SQL leído correctamente\n');

    // Ejecutar el SQL
    console.log('⚙️  Ejecutando script de inicialización...');
    await query(sqlContent);
    console.log('✅ Script ejecutado exitosamente!\n');

    // Verificar las tablas creadas
    console.log('🔍 Verificando tablas creadas...');
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📋 Tablas en la base de datos:');
    result.rows.forEach((row: any) => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log('\n✨ ¡Base de datos inicializada correctamente!\n');
    
    // Mostrar estadísticas
    console.log('📊 Estadísticas:');
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM admins) as admins,
        (SELECT COUNT(*) FROM cuidadores) as cuidadores,
        (SELECT COUNT(*) FROM usuarios) as usuarios,
        (SELECT COUNT(*) FROM dispositivos) as dispositivos
    `);
    
    console.log(`   • Admins: ${stats.rows[0].admins}`);
    console.log(`   • Cuidadores: ${stats.rows[0].cuidadores}`);
    console.log(`   • Usuarios: ${stats.rows[0].usuarios}`);
    console.log(`   • Dispositivos: ${stats.rows[0].dispositivos}\n`);

  } catch (error: any) {
    console.error('\n❌ Error al inicializar la base de datos:', error.message);
    if (error.detail) {
      console.error('Detalles:', error.detail);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar
initDatabase();
