import redis, { ESP32Cache } from './config/redis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script para insertar datos de prueba en Redis
 * Simula datos de sensores ESP32 en tiempo real
 */
async function seedRedis() {
  console.log('🔴 Insertando datos de prueba en Redis...\n');

  try {
    // ===== LIMPIAR DATOS EXISTENTES =====
    console.log('🧹 Limpiando datos existentes de Redis...');
    const keys = await redis.keys('*');
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`   ✓ ${keys.length} claves eliminadas`);
    } else {
      console.log('   ✓ Redis ya estaba vacío');
    }
    console.log('');

    // ===== DISPOSITIVOS DE PRUEBA =====
    const dispositivos = [
      { id: 'ESP32-001', nombre: 'Sala de estar' },
      { id: 'ESP32-002', nombre: 'Dormitorio' },
      { id: 'ESP32-003', nombre: 'Cocina' },
      { id: 'ESP32-004', nombre: 'Baño' },
      { id: 'ESP32-005', nombre: 'Jardín' },
    ];

    console.log('📱 Insertando datos de dispositivos ESP32...\n');

    for (const dispositivo of dispositivos) {
      // Generar datos aleatorios del sensor
      const accX = (Math.random() * 2 - 1).toFixed(2); // -1 a 1
      const accY = (Math.random() * 2 - 1).toFixed(2);
      const accZ = (9.5 + Math.random() * 1).toFixed(2); // ~9.8 (gravedad)
      const fallDetected = Math.random() < 0.2; // 20% de probabilidad de caída simulada

      const sensorData = {
        deviceId: dispositivo.id,
        accX: parseFloat(accX),
        accY: parseFloat(accY),
        accZ: parseFloat(accZ),
        fallDetected: fallDetected,
        timestamp: Date.now(),
      };

      // Guardar datos actuales del dispositivo
      await ESP32Cache.setDeviceData(dispositivo.id, sensorData);
      console.log(`   ${fallDetected ? '🚨' : '✅'} ${dispositivo.id} (${dispositivo.nombre})`);
      console.log(`      Aceleración: X=${accX}, Y=${accY}, Z=${accZ}`);
      console.log(`      Caída detectada: ${fallDetected ? '¡SÍ! ⚠️' : 'No'}`);

      // Guardar estado de conexión
      await ESP32Cache.setDeviceStatus(dispositivo.id, 'online');
      console.log(`      Estado: online\n`);

      // Agregar historial de lecturas (últimas 10 lecturas simuladas)
      console.log(`      📊 Generando historial de 10 lecturas...`);
      for (let i = 0; i < 10; i++) {
        const historyData = {
          deviceId: dispositivo.id,
          accX: parseFloat((Math.random() * 2 - 1).toFixed(2)),
          accY: parseFloat((Math.random() * 2 - 1).toFixed(2)),
          accZ: parseFloat((9.5 + Math.random() * 1).toFixed(2)),
          fallDetected: Math.random() < 0.1, // 10% probabilidad en historial
        };
        await ESP32Cache.addDeviceHistory(dispositivo.id, historyData);
      }
      console.log(`      ✓ Historial guardado\n`);

      // Si hay caída, registrar alerta
      if (fallDetected) {
        await ESP32Cache.setFallAlert(dispositivo.id, {
          deviceId: dispositivo.id,
          accX: parseFloat(accX),
          accY: parseFloat(accY),
          accZ: parseFloat(accZ),
          severity: 'high',
          location: dispositivo.nombre,
        });
        console.log(`      🚨 ALERTA DE CAÍDA REGISTRADA\n`);
      }
    }

    // ===== RESUMEN =====
    console.log('─'.repeat(60));
    console.log('\n📊 Resumen de datos en Redis:\n');

    // Contar claves por tipo
    const allKeys = await redis.keys('*');
    const deviceKeys = allKeys.filter(k => k.startsWith('device:'));
    const historyKeys = allKeys.filter(k => k.startsWith('history:'));
    const statusKeys = allKeys.filter(k => k.startsWith('status:'));
    const alertKeys = allKeys.filter(k => k.startsWith('alert:'));

    console.log(`   📱 Datos de dispositivos: ${deviceKeys.length}`);
    console.log(`   📊 Historiales: ${historyKeys.length}`);
    console.log(`   🔌 Estados de conexión: ${statusKeys.length}`);
    console.log(`   🚨 Alertas de caída: ${alertKeys.length}`);
    console.log(`   📦 Total de claves: ${allKeys.length}\n`);

    // Mostrar alertas recientes
    const recentAlerts = await ESP32Cache.getRecentAlerts();
    if (recentAlerts.length > 0) {
      console.log('🚨 Alertas de caída detectadas:\n');
      recentAlerts.forEach((alert) => {
        const date = new Date(alert.timestamp).toLocaleString('es-ES');
        console.log(`   ⚠️  ${alert.deviceId} - ${alert.location}`);
        console.log(`      Fecha: ${date}`);
        console.log(`      Severidad: ${alert.severity}`);
        console.log('');
      });
    } else {
      console.log('✅ No hay alertas de caída recientes\n');
    }

    // Ejemplo de cómo leer los datos
    console.log('─'.repeat(60));
    console.log('\n💡 Ejemplo de lectura de datos:\n');
    const ejemploData = await ESP32Cache.getDeviceData('ESP32-001');
    console.log('   Datos de ESP32-001:');
    console.log(JSON.stringify(ejemploData, null, 2));
    console.log('');

    const ejemploHistory = await ESP32Cache.getDeviceHistory('ESP32-001', 3);
    console.log('   Últimas 3 lecturas de ESP32-001:');
    ejemploHistory.forEach((reading, i) => {
      const date = new Date(reading.timestamp).toLocaleTimeString('es-ES');
      console.log(`   ${i + 1}. [${date}] X=${reading.accX}, Y=${reading.accY}, Z=${reading.accZ}`);
    });
    console.log('');

    console.log('✨ ¡Datos de prueba de Redis insertados correctamente!\n');
    console.log('🔍 Puedes verificar los datos en Redis Commander:');
    console.log('   http://localhost:8081\n');

  } catch (error: any) {
    console.error('\n❌ Error insertando datos en Redis:', error.message);
    process.exit(1);
  }

  await redis.quit();
  process.exit(0);
}

// Ejecutar
seedRedis();
