import { query } from './config/database';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script para insertar datos de prueba en la base de datos
 */
async function seedDatabase() {
  console.log('Insertando datos de prueba en la base de datos...\n');

  try {
    // ===== LIMPIAR DATOS EXISTENTES =====
    console.log('Limpiando datos existentes...');
    await query('TRUNCATE TABLE usuario_cuidador, usuarios, cuidadores, dispositivos RESTART IDENTITY CASCADE');
    console.log('Datos limpiados\n');

    // ===== CREAR ADMINISTRADORES (Cuidadores con is_admin=true) =====
    console.log('Insertando administradores...');
    const adminPassword = await bcrypt.hash('admin123', 10);

    await query(
      'INSERT INTO cuidadores (nombre, email, password_hash, telefono, is_admin) VALUES ($1, $2, $3, $4, $5)',
      ['Admin Principal', 'admin@stepguard.com', adminPassword, '+34 600 000 000', true]
    );

    await query(
      'INSERT INTO cuidadores (nombre, email, password_hash, telefono, is_admin) VALUES ($1, $2, $3, $4, $5)',
      ['María González Admin', 'maria.gonzalez@stepguard.com', adminPassword, '+34 600 000 001', true]
    );

    console.log('   ✓ 2 administradores creados');
    console.log('   📧 admin@stepguard.com - password: admin123 (Admin)');
    console.log('   📧 maria.gonzalez@stepguard.com - password: admin123 (Admin)\n');

    // ===== CREAR CUIDADORES =====
    console.log('Insertando cuidadores...');
    const cuidadorPassword = await bcrypt.hash('cuidador123', 10);

    const cuidadores = [
      ['Ana Martínez', 'ana.martinez@stepguard.com', '+34 600 111 111'],
      ['Carlos López', 'carlos.lopez@stepguard.com', '+34 600 222 222'],
      ['Laura Sánchez', 'laura.sanchez@stepguard.com', '+34 600 333 333'],
    ];

    for (const [nombre, email, telefono] of cuidadores) {
      await query(
        'INSERT INTO cuidadores (nombre, email, password_hash, telefono, is_admin) VALUES ($1, $2, $3, $4, $5)',
        [nombre, email, cuidadorPassword, telefono, false]
      );
    }

    console.log(`   ✓ ${cuidadores.length} cuidadores creados`);
    console.log('   Todos con password: cuidador123\n');

    // ===== CREAR DISPOSITIVOS =====
    console.log('Insertando dispositivos ESP32...');

    const dispositivos = [
      ['ESP32-001', 'AA:BB:CC:DD:EE:01', 'Dispositivo Sala Principal', 'Sala de estar'],
      ['ESP32-002', 'AA:BB:CC:DD:EE:02', 'Dispositivo Dormitorio', 'Dormitorio principal'],
      ['ESP32-003', 'AA:BB:CC:DD:EE:03', 'Dispositivo Cocina', 'Cocina'],
      ['ESP32-004', 'AA:BB:CC:DD:EE:04', 'Dispositivo Baño', 'Baño'],
      ['ESP32-005', 'AA:BB:CC:DD:EE:05', 'Dispositivo Jardín', 'Jardín exterior'],
    ];

    for (const [device_id, mac_address, nombre, ubicacion] of dispositivos) {
      await query(
        `INSERT INTO dispositivos (device_id, mac_address, nombre, ubicacion, estado, firmware_version) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [device_id, mac_address, nombre, ubicacion, 'offline', '1.0.0']
      );
    }

    console.log(`   ✓ ${dispositivos.length} dispositivos creados`);
    console.log('   Estados: offline (se actualizan cuando se conectan)\n');

    // ===== CREAR USUARIOS =====
    console.log('Insertando usuarios (personas mayores)...');
    const usuarioPassword = await bcrypt.hash('usuario123', 10);

    const usuarios = [
      ['Juan Pérez García', 'juan.perez@example.com', '1949-01-15', 'Calle Mayor 123, Madrid', '+34 600 444 444', 1],
      ['Carmen Rodríguez López', 'carmen.rodriguez@example.com', '1944-06-20', 'Avenida Libertad 45, Barcelona', '+34 600 555 555', 2],
      ['Antonio Fernández Ruiz', 'antonio.fernandez@example.com', '1948-03-10', 'Plaza España 8, Valencia', '+34 600 666 666', 3],
      ['Isabel Martín Sánchez', 'isabel.martin@example.com', '1956-11-25', 'Calle Real 67, Sevilla', '+34 600 777 777', 4],
      ['Francisco García Torres', 'francisco.garcia@example.com', '1941-08-30', 'Paseo Marítimo 22, Málaga', '+34 600 888 888', 5],
    ];

    for (const [nombre, email, fecha_nacimiento, direccion, telefono, dispositivo_id] of usuarios) {
      await query(
        `INSERT INTO usuarios (nombre, email, password_hash, fecha_nacimiento, direccion, telefono, dispositivo_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [nombre, email, usuarioPassword, fecha_nacimiento, direccion, telefono, dispositivo_id]
      );
    }

    console.log(`   ✓ ${usuarios.length} usuarios creados`);
    console.log('   Todos con password: usuario123\n');

    // ===== ASIGNAR CUIDADORES A USUARIOS =====
    console.log('Asignando cuidadores a usuarios...');

    const asignaciones = [
      // Ana (cuidador 1) cuida a Juan, Carmen e Isabel (usuarios 1, 2, 4)
      [1, 1], [2, 1], [4, 1],
      // Carlos (cuidador 2) cuida a Antonio y Francisco (usuarios 3, 5)
      [3, 2], [5, 2],
      // Laura (cuidador 3) cuida a Carmen y Francisco (usuarios 2, 5)
      [2, 3], [5, 3],
    ];

    for (const [usuario_id, cuidador_id] of asignaciones) {
      await query(
        'INSERT INTO usuario_cuidador (usuario_id, cuidador_id) VALUES ($1, $2)',
        [usuario_id, cuidador_id]
      );
    }

    console.log(`   ✓ ${asignaciones.length} relaciones cuidador-usuario creadas\n`);

    // ===== RESUMEN FINAL =====
    console.log('Resumen de datos insertados:');
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM cuidadores WHERE is_admin = true) as admins,
        (SELECT COUNT(*) FROM cuidadores WHERE is_admin = false) as cuidadores,
        (SELECT COUNT(*) FROM usuarios) as usuarios,
        (SELECT COUNT(*) FROM dispositivos) as dispositivos,
        (SELECT COUNT(*) FROM usuario_cuidador) as relaciones
    `);

    console.log(`   • Administradores: ${stats.rows[0].admins}`);
    console.log(`   • Cuidadores: ${stats.rows[0].cuidadores}`);
    console.log(`   • Usuarios: ${stats.rows[0].usuarios}`);
    console.log(`   • Dispositivos: ${stats.rows[0].dispositivos}`);
    console.log(`   • Relaciones cuidador-usuario: ${stats.rows[0].relaciones}\n`);

    console.log('Datos de prueba insertados correctamente!\n');
    console.log('Credenciales de acceso:');
    console.log('   Admin:    admin@stepguard.com / admin123 (is_admin=true)');
    console.log('   Cuidador: ana.martinez@stepguard.com / cuidador123 (is_admin=false)');
    console.log('   Usuario:  juan.perez@example.com / usuario123\n');

  } catch (error: any) {
    console.error('\nError insertando datos:', error.message);
    if (error.detail) {
      console.error('Detalles:', error.detail);
    }
    process.exit(1);
  }

  process.exit(0);
}

// Ejecutar
seedDatabase();
