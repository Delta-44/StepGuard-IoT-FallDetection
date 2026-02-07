import { query } from './config/database';
import dotenv from 'dotenv';

dotenv.config();

interface Dispositivo {
  mac_address: string;
  nombre: string;
  estado: boolean;
  total_impactos?: number;
  ultima_magnitud?: number;
}

async function seedDevices() {
  try {
    console.log('📡 Conectando a la base de datos PostgreSQL\n');

    // Generar 30 dispositivos ESP32
    const dispositivos: Dispositivo[] = [];
    
    // Prefijos de MAC addresses realistas para ESP32
    const macPrefixes = ['24:0A:C4', 'AC:67:B2', '3C:71:BF', 'A4:CF:12', '84:CC:A8'];
    
    console.log('🔧 Generando 30 dispositivos ESP32...\n');

    for (let i = 1; i <= 30; i++) {
      const prefix = macPrefixes[Math.floor(Math.random() * macPrefixes.length)];
      const suffix1 = Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
      const suffix2 = Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
      const suffix3 = Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
      
      const macAddress = `${prefix}:${suffix1}:${suffix2}:${suffix3}`;
      const nombre = `StepGuard ESP32 #${i.toString().padStart(3, '0')}`;
      
      // 70% online, 30% offline
      const estado = Math.random() > 0.3;
      
      // Algunos con historial de impactos
      const total_impactos = Math.random() > 0.5 ? Math.floor(Math.random() * 20) : 0;
      const ultima_magnitud = total_impactos > 0 ? parseFloat((Math.random() * 15 + 5).toFixed(2)) : undefined;

      dispositivos.push({
        mac_address: macAddress,
        nombre,
        estado,
        total_impactos,
        ultima_magnitud
      });
    }

    // Verificar dispositivos existentes
    console.log('🔍 Verificando dispositivos existentes...\n');
    const existingResult = await query('SELECT mac_address FROM dispositivos');
    const existingMacs = new Set(existingResult.rows.map(row => row.mac_address));
    
    console.log(`📊 Dispositivos existentes: ${existingMacs.size}\n`);

    // Filtrar solo los nuevos
    const newDevices = dispositivos.filter(d => !existingMacs.has(d.mac_address));

    if (newDevices.length === 0) {
      console.log('✅ Todos los dispositivos ya existen en la base de datos');
      return;
    }

    console.log(`📥 Insertando ${newDevices.length} dispositivos nuevos...\n`);

    // Insertar dispositivos
    let insertedCount = 0;
    let skippedCount = 0;

    for (const dispositivo of newDevices) {
      try {
        await query(
          `INSERT INTO dispositivos (mac_address, nombre, estado, total_impactos, ultima_magnitud, ultima_conexion)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (mac_address) DO NOTHING`,
          [
            dispositivo.mac_address,
            dispositivo.nombre,
            dispositivo.estado,
            dispositivo.total_impactos || 0,
            dispositivo.ultima_magnitud || null,
            dispositivo.estado ? new Date() : null
          ]
        );
        
        const estadoIcon = dispositivo.estado ? '🟢' : '🔴';
        const impactosText = dispositivo.total_impactos ? ` | ${dispositivo.total_impactos} impactos` : '';
        console.log(`   ${estadoIcon} ${dispositivo.mac_address} - ${dispositivo.nombre}${impactosText}`);
        insertedCount++;
      } catch (error: any) {
        if (error.code === '23505') {
          // Duplicate key
          skippedCount++;
        } else {
          console.error(`   ❌ Error insertando ${dispositivo.mac_address}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Dispositivos insertados: ${insertedCount}`);
    if (skippedCount > 0) {
      console.log(`⚠️  Dispositivos omitidos (ya existían): ${skippedCount}`);
    }

    // Mostrar resumen final
    const totalResult = await query('SELECT COUNT(*) as total FROM dispositivos');
    const onlineResult = await query('SELECT COUNT(*) as total FROM dispositivos WHERE estado = true');
    const offlineResult = await query('SELECT COUNT(*) as total FROM dispositivos WHERE estado = false');
    
    console.log('\n📊 RESUMEN TOTAL DEL SISTEMA:');
    console.log(`   • Total dispositivos: ${totalResult.rows[0].total}`);
    console.log(`   • 🟢 Online: ${onlineResult.rows[0].total}`);
    console.log(`   • 🔴 Offline: ${offlineResult.rows[0].total}`);

    // Mostrar dispositivos disponibles para asignar (sin usuario)
    const availableResult = await query(`
      SELECT d.mac_address, d.nombre, d.estado
      FROM dispositivos d
      LEFT JOIN usuarios u ON d.mac_address = u.dispositivo_mac
      WHERE u.dispositivo_mac IS NULL
      ORDER BY d.fecha_registro DESC
      LIMIT 10
    `);

    if (availableResult.rows.length > 0) {
      console.log('\n📋 Dispositivos disponibles para asignar (sin usuario):');
      availableResult.rows.forEach(row => {
        const estadoIcon = row.estado ? '🟢' : '🔴';
        console.log(`   ${estadoIcon} ${row.mac_address} - ${row.nombre}`);
      });
    }

    console.log('\n🎉 ¡Dispositivos insertados exitosamente!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Ejecutar
seedDevices().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
