import { Client } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST?.includes('neon.tech') || process.env.DB_HOST?.includes('supabase')
    ? { rejectUnauthorized: false }
    : false,
});

async function insertDemoData() {
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Hash de contraseñas
    const adminHash = await bcrypt.hash('admin123', 10);
    const cuidadorHash = await bcrypt.hash('cuidador123', 10);
    const usuarioHash = await bcrypt.hash('usuario123', 10);

    // Limpiar datos existentes (opcional)
    console.log('🧹 Limpiando datos anteriores...');
    await client.query('TRUNCATE TABLE notificaciones, eventos_caida, audit_log, usuario_cuidador, usuarios, cuidadores, dispositivos RESTART IDENTITY CASCADE');

    // 1. Insertar cuidadores
    console.log('👥 Insertando cuidadores...');
    const cuidadorResult = await client.query(`
      INSERT INTO cuidadores (nombre, email, password_hash, telefono, is_admin, password_last_changed_at) 
      VALUES 
        ('Admin Principal', 'admin@stepguard.com', $1, '+34 600 000 000', true, NOW()),
        ('María García', 'maria@stepguard.com', $2, '+34 600 123 456', false, NOW()),
        ('Carlos Rodríguez', 'carlos@stepguard.com', $2, '+34 600 789 012', false, NOW())
      RETURNING id, nombre, email, is_admin
    `, [adminHash, cuidadorHash]);
    console.log(`✅ ${cuidadorResult.rowCount} cuidadores insertados`);
    cuidadorResult.rows.forEach(row => console.log(`   - ${row.nombre} (${row.email}) ${row.is_admin ? '[ADMIN]' : ''}`));

    // 2. Insertar dispositivos
    console.log('\n📱 Insertando dispositivos...');
    const dispositivoResult = await client.query(`
      INSERT INTO dispositivos (mac_address, nombre, estado, total_impactos, ultima_conexion) 
      VALUES 
        ('AA:BB:CC:DD:EE:01', 'ESP32-Sala', true, 5, NOW()),
        ('AA:BB:CC:DD:EE:02', 'ESP32-Habitación', true, 2, NOW()),
        ('AA:BB:CC:DD:EE:03', 'ESP32-Cocina', false, 8, NOW() - INTERVAL '2 hours')
      RETURNING mac_address, nombre, estado
    `);
    console.log(`✅ ${dispositivoResult.rowCount} dispositivos insertados`);
    dispositivoResult.rows.forEach(row => console.log(`   - ${row.mac_address}: ${row.nombre} [${row.estado ? 'online' : 'offline'}]`));

    // 3. Insertar usuarios
    console.log('\n🧓 Insertando usuarios...');
    const usuarioResult = await client.query(`
      INSERT INTO usuarios (nombre, email, password_hash, fecha_nacimiento, direccion, telefono, dispositivo_mac, password_last_changed_at) 
      VALUES 
        ('Juan Pérez', 'juan@stepguard.com', $1, '1945-03-15', 'Calle Mayor 123, Madrid', '+34 600 654 321', 'AA:BB:CC:DD:EE:01', NOW()),
        ('Ana Martínez', 'ana@stepguard.com', $1, '1950-07-22', 'Avenida Principal 456, Barcelona', '+34 600 888 999', 'AA:BB:CC:DD:EE:02', NOW()),
        ('Luis Fernández', 'luis@stepguard.com', $1, '1948-11-30', 'Plaza Central 789, Valencia', '+34 600 777 666', 'AA:BB:CC:DD:EE:03', NOW())
      RETURNING id, nombre, email, dispositivo_mac
    `, [usuarioHash]);
    console.log(`✅ ${usuarioResult.rowCount} usuarios insertados`);
    usuarioResult.rows.forEach(row => console.log(`   - ${row.nombre} (${row.email}) - Dispositivo: ${row.dispositivo_mac}`));

    // 4. Asignar cuidadores a usuarios
    console.log('\n🔗 Asignando cuidadores a usuarios...');
    await client.query(`
      INSERT INTO usuario_cuidador (usuario_id, cuidador_id) 
      VALUES 
        (1, 1), -- Juan -> Admin
        (1, 2), -- Juan -> María
        (2, 2), -- Ana -> María
        (3, 1), -- Luis -> Admin
        (3, 3)  -- Luis -> Carlos
    `);
    console.log('✅ Relaciones usuario-cuidador creadas');

    // 5. Insertar algunos eventos de caída de ejemplo
    console.log('\n🚨 Insertando eventos de caída de ejemplo...');
    const eventosResult = await client.query(`
      INSERT INTO eventos_caida (dispositivo_mac, usuario_id, fecha_hora, acc_x, acc_y, acc_z, severidad, estado, ubicacion) 
      VALUES 
        ('AA:BB:CC:DD:EE:01', 1, NOW() - INTERVAL '2 hours', 12.5, -3.2, 8.7, 'high', 'atendida', 'Sala de estar'),
        ('AA:BB:CC:DD:EE:01', 1, NOW() - INTERVAL '1 day', 8.3, -2.1, 5.4, 'medium', 'atendida', 'Sala de estar'),
        ('AA:BB:CC:DD:EE:02', 2, NOW() - INTERVAL '3 hours', 15.2, -4.8, 10.3, 'critical', 'pendiente', 'Habitación'),
        ('AA:BB:CC:DD:EE:03', 3, NOW() - INTERVAL '5 days', 6.7, -1.8, 4.2, 'low', 'falsa_alarma', 'Cocina')
      RETURNING id, usuario_id, severidad, estado
    `);
    console.log(`✅ ${eventosResult.rowCount} eventos de caída insertados`);
    eventosResult.rows.forEach(row => console.log(`   - Evento #${row.id}: Usuario ${row.usuario_id} - ${row.severidad} [${row.estado}]`));

    // 6. Insertar notificaciones
    console.log('\n📧 Insertando notificaciones...');
    await client.query(`
      INSERT INTO notificaciones (evento_id, cuidador_id, tipo, estado, asunto, contenido) 
      VALUES 
        (1, 1, 'email', 'entregada', 'Alerta de caída detectada', 'Se ha detectado una caída para Juan Pérez'),
        (1, 2, 'app', 'leida', 'Alerta de caída detectada', 'Se ha detectado una caída para Juan Pérez'),
        (3, 2, 'push', 'enviada', 'Caída crítica detectada', 'URGENTE: Caída crítica para Ana Martínez')
    `);
    console.log('✅ Notificaciones insertadas');

    console.log('\n✨ ¡Datos de prueba insertados exitosamente!\n');
    
    // Resumen
    console.log('📊 RESUMEN:');
    console.log('   - Credenciales de acceso:');
    console.log('     • Admin: admin@stepguard.com / admin123');
    console.log('     • Cuidador: maria@stepguard.com / cuidador123');
    console.log('     • Usuario: juan@stepguard.com / usuario123');
    console.log('   - 3 cuidadores (1 admin, 2 regulares)');
    console.log('   - 3 dispositivos ESP32');
    console.log('   - 3 usuarios asignados a dispositivos');
    console.log('   - 4 eventos de caída registrados');
    console.log('   - 3 notificaciones enviadas\n');

  } catch (error) {
    console.error('❌ Error insertando datos:', error);
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Desconectado de la base de datos');
  }
}

insertDemoData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
