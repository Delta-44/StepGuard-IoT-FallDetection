import pool, { query } from './config/database';
import redis, { ESP32Cache } from './config/redis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script para probar las conexiones a PostgreSQL y Redis
 */
async function testConnections() {
  console.log('🔍 Probando conexiones a las bases de datos...\n');

  // ===== Test PostgreSQL =====
  console.log('📊 PostgreSQL:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   User: ${process.env.DB_USER}`);
  
  try {
    const result = await query('SELECT NOW() as current_time, version() as version');
    console.log('   ✅ Conexión exitosa!');
    console.log(`   ⏰ Hora del servidor: ${result.rows[0].current_time}`);
    console.log(`   📦 Versión: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`);
  } catch (error: any) {
    console.error('   ❌ Error conectando a PostgreSQL:', error.message);
    console.error('   Detalles:', error);
    process.exit(1);
  }

  // ===== Test Redis =====
  console.log('🔴 Redis:');
  console.log(`   Host: ${process.env.REDIS_HOST}`);
  console.log(`   Port: ${process.env.REDIS_PORT}`);
  
  try {
    const pong = await redis.ping();
    console.log(`   ✅ Conexión exitosa! (${pong})`);
    
    // Test de escritura/lectura
    await redis.set('test:connection', 'OK', 'EX', 10);
    const value = await redis.get('test:connection');
    console.log(`   ✅ Test de escritura/lectura: ${value}`);
    
    // Información del servidor
    const info = await redis.info('server');
    const redisVersion = info.match(/redis_version:([^\r\n]+)/)?.[1];
    console.log(`   📦 Versión: ${redisVersion}\n`);
  } catch (error: any) {
    console.error('   ❌ Error conectando a Redis:', error.message);
    console.error('   Detalles:', error);
    process.exit(1);
  }

  // ===== Test de funciones helper Redis =====
  console.log('🧪 Probando funciones helper de Redis...');
  try {
    // Guardar datos de dispositivo
    await ESP32Cache.setDeviceData('ESP32-TEST', {
      deviceId: 'ESP32-TEST',
      accX: -1.23,
      accY: 0.45,
      accZ: 9.81,
      fallDetected: false,
    });
    console.log('   ✅ setDeviceData() funciona correctamente');

    // Leer datos de dispositivo
    const deviceData = await ESP32Cache.getDeviceData('ESP32-TEST');
    console.log('   ✅ getDeviceData() funciona correctamente');
    console.log('   📊 Datos recuperados:', deviceData);

    // Guardar historial
    await ESP32Cache.addDeviceHistory('ESP32-TEST', {
      accX: -2.1,
      accY: 1.2,
      accZ: 10.5,
      fallDetected: false,
    });
    console.log('   ✅ addDeviceHistory() funciona correctamente');

    // Limpiar datos de prueba
    await ESP32Cache.clearDeviceData('ESP32-TEST');
    console.log('   ✅ clearDeviceData() funciona correctamente\n');
  } catch (error: any) {
    console.error('   ❌ Error en funciones helper:', error.message);
  }

  console.log('✨ ¡Todas las conexiones funcionan correctamente!\n');
  
  // Cerrar conexiones
  await pool.end();
  await redis.quit();
  process.exit(0);
}

// Ejecutar pruebas
testConnections().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
