import redis, { ESP32Cache } from '../config/redis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script para insertar datos de prueba en Redis
 * Simula datos de sensores ESP32 en tiempo real
 */
async function seedRedis() {
  console.log('Insertando datos de prueba en Redis...\n');

  try {
    // ===== LIMPIAR DATOS EXISTENTES =====
    console.log('Limpiando datos existentes de Redis...');
    const keys = await redis.keys('*');
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`   ${keys.length} claves eliminadas`);
    } else {
      console.log('   Redis ya estaba vacío');
    }
    console.log('');

    // ===== DISPOSITIVOS DE PRUEBA =====
    // Usando direcciones MAC reales para coincidir con la interfaz ESP32
    const dispositivos = [
      { macAddress: 'AA:BB:CC:DD:EE:01', name: 'ESP32-Sala' },
      { macAddress: 'AA:BB:CC:DD:EE:02', name: 'ESP32-Dormitorio' },
      { macAddress: 'AA:BB:CC:DD:EE:03', name: 'ESP32-Cocina' },
    ];

    console.log('Insertando datos de dispositivos ESP32...\n');

    for (const dispositivo of dispositivos) {
      // Generar datos según interfaz ESP32
      const impact_magnitude = parseFloat((Math.random() * 15).toFixed(2)); // 0-15 m/s²
      const isFallDetected = Math.random() < 0.2; // 20% de probabilidad de caída
      const isButtonPressed = Math.random() < 0.05; // 5% de probabilidad de botón SOS

      const esp32Data = {
        macAddress: dispositivo.macAddress,
        name: dispositivo.name,
        impact_count: Math.floor(Math.random() * 10), // 0-10 impactos
        impact_magnitude,
        timestamp: new Date(),
        status: true, // online
        isFallDetected,
        isButtonPressed,
      };

      // Guardar datos actuales del dispositivo
      await ESP32Cache.setDeviceData(dispositivo.macAddress, esp32Data);
      console.log(`   ${isFallDetected ? 'ALERTA' : 'OK'} ${dispositivo.name} (${dispositivo.macAddress})`);
      console.log(`      Impactos: ${esp32Data.impact_count}, Magnitud: ${impact_magnitude} m/s²`);
      console.log(`      Caída detectada: ${isFallDetected ? 'SI' : 'No'}`);
      console.log(`      Botón SOS: ${isButtonPressed ? 'PRESIONADO' : 'No'}`);

      // Guardar estado de conexión
      await ESP32Cache.setDeviceStatus(dispositivo.macAddress, true);
      console.log(`      Estado: online\n`);

      // Agregar historial de lecturas (últimas 10 lecturas simuladas)
      console.log(`      Generando historial de 10 lecturas...`);
      for (let i = 0; i < 10; i++) {
        const historyData = {
          macAddress: dispositivo.macAddress,
          name: dispositivo.name,
          impact_count: Math.floor(Math.random() * 10),
          impact_magnitude: parseFloat((Math.random() * 15).toFixed(2)),
          status: true,
          isFallDetected: Math.random() < 0.1,
          isButtonPressed: false,
        };
        await ESP32Cache.addDeviceHistory(dispositivo.macAddress, historyData);
      }
      console.log(`      Historial guardado\n`);

      // Si hay caída o botón SOS, registrar alerta
      if (isFallDetected || isButtonPressed) {
        await ESP32Cache.setFallAlert(dispositivo.macAddress, {
          macAddress: dispositivo.macAddress,
          name: dispositivo.name,
          impact_magnitude,
          severity: isButtonPressed ? 'critical' : 'high',
          type: isButtonPressed ? 'SOS_BUTTON' : 'FALL_DETECTED',
        });
        console.log(`      ALERTA REGISTRADA: ${isButtonPressed ? 'SOS MANUAL' : 'CAÍDA'}\n`);
      }
    }

    // ===== RESUMEN =====
    console.log('─'.repeat(60));
    console.log('\nResumen de datos en Redis:\n');

    // Contar claves por tipo
    const allKeys = await redis.keys('*');
    const deviceKeys = allKeys.filter(k => k.startsWith('device:'));
    const historyKeys = allKeys.filter(k => k.startsWith('history:'));
    const statusKeys = allKeys.filter(k => k.startsWith('status:'));
    const alertKeys = allKeys.filter(k => k.startsWith('alert:'));

    console.log(`   Datos de dispositivos: ${deviceKeys.length}`);
    console.log(`   Historiales: ${historyKeys.length}`);
    console.log(`   Estados de conexión: ${statusKeys.length}`);
    console.log(`   Alertas de caída: ${alertKeys.length}`);
    console.log(`   Total de claves: ${allKeys.length}\n`);

    // Mostrar alertas recientes
    const recentAlerts = await ESP32Cache.getRecentAlerts();
    if (recentAlerts.length > 0) {
      console.log('Alertas de caída detectadas:\n');
      recentAlerts.forEach((alert) => {
        const date = new Date(alert.timestamp).toLocaleString('es-ES');
        console.log(`   ${alert.macAddress} - ${alert.name}`);
        console.log(`      Fecha: ${date}`);
        console.log(`      Tipo: ${alert.type}`);
        console.log(`      Severidad: ${alert.severity}`);
        console.log('');
      });
    } else {
      console.log('No hay alertas de caída recientes\n');
    }

    // Ejemplo de cómo leer los datos
    console.log('─'.repeat(60));
    console.log('\nEjemplo de lectura de datos:\n');
    const ejemploData = await ESP32Cache.getDeviceData('AA:BB:CC:DD:EE:01');
    console.log('   Datos de AA:BB:CC:DD:EE:01:');
    console.log(JSON.stringify(ejemploData, null, 2));
    console.log('');

    const ejemploHistory = await ESP32Cache.getDeviceHistory('AA:BB:CC:DD:EE:01', 3);
    console.log('   Últimas 3 lecturas de AA:BB:CC:DD:EE:01:');
    ejemploHistory.forEach((reading, i) => {
      console.log(`   ${i + 1}. Impactos=${reading.impact_count}, Magnitud=${reading.impact_magnitude} m/s²`);
    });
    console.log('');

    console.log('Datos de prueba de Redis insertados correctamente!\n');
    console.log('Puedes verificar los datos en Redis Commander:');
    console.log('   http://localhost:8081\n');

  } catch (error: any) {
    console.error('\nError insertando datos en Redis:', error.message);
    process.exit(1);
  }

  await redis.quit();
  process.exit(0);
}

// Ejecutar
seedRedis();
