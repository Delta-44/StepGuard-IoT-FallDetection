import redis, { ESP32Cache } from './config/redis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script para visualizar todos los datos almacenados en Redis
 */
async function viewRedisData() {
  console.log('🔴 Visualizando datos de Redis...\n');
  console.log(`📡 Conectado a: ${process.env.REDIS_HOST}\n`);

  try {
    // ===== LISTAR TODAS LAS CLAVES =====
    console.log('🔑 Claves en Redis:\n');
    const allKeys = await redis.keys('*');
    
    if (allKeys.length === 0) {
      console.log('   ❌ No hay datos en Redis');
      console.log('   💡 Ejecuta: npm run redis:seed\n');
      await redis.quit();
      process.exit(0);
    }

    console.log(`   Total: ${allKeys.length} claves\n`);

    // Agrupar por tipo
    const deviceKeys = allKeys.filter(k => k.startsWith('device:'));
    const historyKeys = allKeys.filter(k => k.startsWith('history:'));
    const statusKeys = allKeys.filter(k => k.startsWith('status:'));
    const alertKeys = allKeys.filter(k => k.startsWith('alert:'));

    // ===== DATOS DE DISPOSITIVOS =====
    if (deviceKeys.length > 0) {
      console.log('─'.repeat(70));
      console.log('📱 DATOS ACTUALES DE DISPOSITIVOS\n');
      
      for (const key of deviceKeys) {
        const deviceId = key.replace('device:', '');
        const data = await ESP32Cache.getDeviceData(deviceId);
        const status = await ESP32Cache.getDeviceStatus(deviceId);
        
        if (data) {
          const icon = data.fallDetected ? '🚨' : '✅';
          const statusIcon = status === 'online' ? '🟢' : '🔴';
          
          console.log(`${icon} ${deviceId} ${statusIcon} ${status.toUpperCase()}`);
          console.log(`   Aceleración:`);
          console.log(`     X: ${data.accX}  Y: ${data.accY}  Z: ${data.accZ}`);
          console.log(`   Caída detectada: ${data.fallDetected ? '¡SÍ! ⚠️' : 'No'}`);
          
          if (data.timestamp) {
            const date = new Date(data.timestamp);
            console.log(`   Última actualización: ${date.toLocaleString('es-ES')}`);
          }
          console.log('');
        }
      }
    }

    // ===== HISTORIAL =====
    if (historyKeys.length > 0) {
      console.log('─'.repeat(70));
      console.log('📊 HISTORIAL DE LECTURAS\n');
      
      for (const key of historyKeys) {
        const deviceId = key.replace('history:', '');
        const history = await ESP32Cache.getDeviceHistory(deviceId, 5);
        
        if (history.length > 0) {
          console.log(`📈 ${deviceId} - Últimas ${history.length} lecturas:`);
          
          history.forEach((reading, i) => {
            const date = new Date(reading.timestamp);
            const time = date.toLocaleTimeString('es-ES');
            const fallIcon = reading.fallDetected ? '⚠️' : '✓';
            
            console.log(`   ${i + 1}. [${time}] ${fallIcon} X=${reading.accX} Y=${reading.accY} Z=${reading.accZ}`);
          });
          console.log('');
        }
      }
    }

    // ===== ALERTAS DE CAÍDA =====
    console.log('─'.repeat(70));
    console.log('🚨 ALERTAS DE CAÍDA\n');
    
    const alerts = await ESP32Cache.getRecentAlerts();
    
    if (alerts.length > 0) {
      console.log(`   Total de alertas: ${alerts.length}\n`);
      
      alerts.forEach((alert, i) => {
        const date = new Date(alert.timestamp);
        console.log(`   ${i + 1}. 🚨 ${alert.deviceId}`);
        console.log(`      Ubicación: ${alert.location || 'Desconocida'}`);
        console.log(`      Fecha: ${date.toLocaleString('es-ES')}`);
        console.log(`      Severidad: ${alert.severity || 'medium'}`);
        console.log(`      Aceleración: X=${alert.accX} Y=${alert.accY} Z=${alert.accZ}`);
        console.log('');
      });
    } else {
      console.log('   ✅ No hay alertas de caída recientes\n');
    }

    // ===== ESTADÍSTICAS =====
    console.log('─'.repeat(70));
    console.log('📊 ESTADÍSTICAS\n');
    console.log(`   📱 Dispositivos: ${deviceKeys.length}`);
    console.log(`   📊 Historiales: ${historyKeys.length}`);
    console.log(`   🔌 Estados: ${statusKeys.length}`);
    console.log(`   🚨 Alertas: ${alertKeys.length}`);
    console.log(`   📦 Total claves: ${allKeys.length}\n`);

    // ===== INFORMACIÓN DE MEMORIA =====
    const info = await redis.info('memory');
    const usedMemory = info.match(/used_memory_human:([^\r\n]+)/)?.[1];
    if (usedMemory) {
      console.log(`   💾 Memoria usada: ${usedMemory}\n`);
    }

    console.log('─'.repeat(70));

  } catch (error: any) {
    console.error('\n❌ Error consultando Redis:', error.message);
    process.exit(1);
  }

  await redis.quit();
  process.exit(0);
}

// Ejecutar
viewRedisData();
