import bcrypt from 'bcryptjs';
import { query } from './config/database';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script para insertar 15 cuidadores y 20 usuarios en la base de datos
 */

const nombresCuidadores = [
  'Ana García Martínez', 'Carlos Rodríguez López', 'María José Sánchez', 'Juan Miguel Torres',
  'Laura Fernández Díaz', 'Pedro Antonio Ruiz', 'Carmen Isabel Moreno', 'Francisco Javier Álvarez',
  'Elena Cristina Romero', 'Miguel Ángel Navarro', 'Rosa María Gil', 'José Luis Serrano',
  'Lucía Martín Muñoz', 'Manuel Jesús Ibáñez', 'Patricia Gómez Castro'
];

const nombresUsuarios = [
  'Antonio Pérez González', 'Mercedes López Ramírez', 'Rafael Martínez Soto', 'Dolores Fernández Cruz',
  'José García Blanco', 'Pilar Sánchez Vega', 'Manuel Rodríguez Ortiz', 'Teresa Jiménez Mora',
  'Francisco Díaz Rubio', 'Amparo Torres Medina', 'Enrique Ruiz Herrera', 'Josefa Moreno Prieto',
  'Vicente Álvarez Campos', 'Emilia Romero Gallego', 'Salvador Navarro Delgado', 'Consuelo Gil Marín',
  'Ángel Serrano Iglesias', 'Encarna Martín Núñez', 'Ricardo Muñoz Vargas', 'Rosario Gómez Suárez'
];

const provinciasEspañolas = [
  { ciudad: 'Madrid', cp: '28001' }, { ciudad: 'Barcelona', cp: '08001' },
  { ciudad: 'Valencia', cp: '46001' }, { ciudad: 'Sevilla', cp: '41001' },
  { ciudad: 'Zaragoza', cp: '50001' }, { ciudad: 'Málaga', cp: '29001' },
  { ciudad: 'Murcia', cp: '30001' }, { ciudad: 'Palma', cp: '07001' },
  { ciudad: 'Las Palmas', cp: '35001' }, { ciudad: 'Bilbao', cp: '48001' },
  { ciudad: 'Alicante', cp: '03001' }, { ciudad: 'Córdoba', cp: '14001' },
  { ciudad: 'Valladolid', cp: '47001' }, { ciudad: 'Vigo', cp: '36201' },
  { ciudad: 'Gijón', cp: '33201' }, { ciudad: 'Granada', cp: '18001' },
  { ciudad: 'Santander', cp: '39001' }, { ciudad: 'Burgos', cp: '09001' },
  { ciudad: 'Toledo', cp: '45001' }, { ciudad: 'Salamanca', cp: '37001' }
];

const calles = [
  'Calle Mayor', 'Avenida Principal', 'Plaza España', 'Calle Real', 'Paseo Marítimo',
  'Calle del Sol', 'Avenida Libertad', 'Plaza Central', 'Calle Ancha', 'Paseo del Parque',
  'Calle Nueva', 'Avenida Constitución', 'Plaza Mayor', 'Calle Larga', 'Paseo de la Estación',
  'Calle San Juan', 'Avenida Europa', 'Plaza de la Cruz', 'Calle Victoria', 'Paseo de Gracia'
];

const generarTelefono = (): string => {
  const prefijos = ['600', '610', '620', '630', '640', '650', '660', '670', '680', '690'];
  const prefijo = prefijos[Math.floor(Math.random() * prefijos.length)];
  const numero = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `+34 ${prefijo} ${numero.substring(0, 3)} ${numero.substring(3)}`;
};

const generarEmail = (nombre: string, tipo: 'cuidador' | 'usuario'): string => {
  const nombreLimpio = nombre
    .toLowerCase()
    .replace(/\s+/g, '.')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const dominio = tipo === 'cuidador' ? 'cuidadores.stepguard.com' : 'usuarios.stepguard.com';
  return `${nombreLimpio}@${dominio}`;
};

const generarFechaNacimiento = (): string => {
  const año = 1935 + Math.floor(Math.random() * 25); // Entre 1935 y 1959 (65-90 años)
  const mes = (1 + Math.floor(Math.random() * 12)).toString().padStart(2, '0');
  const dia = (1 + Math.floor(Math.random() * 28)).toString().padStart(2, '0');
  return `${año}-${mes}-${dia}`;
};

const generarDireccion = (): string => {
  const calle = calles[Math.floor(Math.random() * calles.length)];
  const numero = Math.floor(Math.random() * 200) + 1;
  const piso = Math.random() > 0.3 ? `, ${Math.floor(Math.random() * 10) + 1}º${String.fromCharCode(65 + Math.floor(Math.random() * 4))}` : '';
  const provincia = provinciasEspañolas[Math.floor(Math.random() * provinciasEspañolas.length)];
  return `${calle} ${numero}${piso}, ${provincia.cp} ${provincia.ciudad}`;
};

async function seedExtendedData() {
  console.log('🌱 Insertando datos extendidos: 15 cuidadores y 20 usuarios\n');
  console.log('='.repeat(70) + '\n');

  try {
    // ===== INSERTAR CUIDADORES =====
    console.log('👨‍⚕️ INSERTANDO CUIDADORES\n');
    const cuidadorPassword = await bcrypt.hash('Cuidador2024!', 10);
    
    let cuidadoresCreados = 0;
    for (let i = 0; i < 15; i++) {
      const nombre = nombresCuidadores[i];
      const email = generarEmail(nombre, 'cuidador');
      const telefono = generarTelefono();
      const isAdmin = i < 2; // Los primeros 2 son administradores

      try {
        // Verificar si ya existe
        const existente = await query('SELECT id FROM cuidadores WHERE email = $1', [email]);
        
        if (existente.rows.length > 0) {
          console.log(`   ⚠️  Ya existe: ${nombre}`);
        } else {
          await query(
            `INSERT INTO cuidadores (nombre, email, password_hash, telefono, is_admin) 
             VALUES ($1, $2, $3, $4, $5)`,
            [nombre, email, cuidadorPassword, telefono, isAdmin]
          );
          console.log(`   ✅ ${nombre} ${isAdmin ? '👑' : ''}`);
          console.log(`      📧 ${email}`);
          console.log(`      📞 ${telefono}\n`);
          cuidadoresCreados++;
        }
      } catch (error: any) {
        console.error(`   ❌ Error con ${nombre}: ${error.message}\n`);
      }
    }

    console.log('─'.repeat(70));
    console.log(`📊 Total cuidadores creados: ${cuidadoresCreados}/15\n`);
    console.log('='.repeat(70) + '\n');

    // ===== CREAR DISPOSITIVOS SI NO EXISTEN =====
    console.log('📱 VERIFICANDO DISPOSITIVOS\n');
    const dispositivosExistentes = await query('SELECT COUNT(*) as count FROM dispositivos');
    const cantidadDispositivos = parseInt(dispositivosExistentes.rows[0].count);

    if (cantidadDispositivos < 20) {
      console.log(`   🔧 Creando ${20 - cantidadDispositivos} dispositivos adicionales...\n`);
      
      for (let i = cantidadDispositivos + 1; i <= 20; i++) {
        const macAddress = `AA:BB:CC:DD:EE:${i.toString(16).padStart(2, '0').toUpperCase()}`;
        const nombre = `Dispositivo ESP32-${i.toString().padStart(3, '0')}`;

        try {
          await query(
            `INSERT INTO dispositivos (mac_address, nombre, estado) 
             VALUES ($1, $2, $3)`,
            [macAddress, nombre, false]
          );
          console.log(`   ✅ ${macAddress} - ${nombre}`);
        } catch (error: any) {
          if (!error.message.includes('duplicate')) {
            console.error(`   ❌ Error creando dispositivo ${macAddress}: ${error.message}`);
          }
        }
      }
      console.log('');
    } else {
      console.log(`   ✅ Ya existen ${cantidadDispositivos} dispositivos\n`);
    }

    console.log('─'.repeat(70));
    console.log('='.repeat(70) + '\n');

    // ===== INSERTAR USUARIOS =====
    console.log('👴 INSERTANDO USUARIOS (PERSONAS MAYORES)\n');
    const usuarioPassword = await bcrypt.hash('Usuario2024!', 10);
    
    let usuariosCreados = 0;
    const dispositivos = await query('SELECT mac_address FROM dispositivos ORDER BY fecha_registro LIMIT 20');

    for (let i = 0; i < 20; i++) {
      const nombre = nombresUsuarios[i];
      const email = generarEmail(nombre, 'usuario');
      const telefono = generarTelefono();
      const fechaNacimiento = generarFechaNacimiento();
      const direccion = generarDireccion();
      const dispositivoMac = dispositivos.rows[i % dispositivos.rows.length].mac_address;

      try {
        // Verificar si ya existe
        const existente = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
        
        if (existente.rows.length > 0) {
          console.log(`   ⚠️  Ya existe: ${nombre}`);
        } else {
          const result = await query(
            `INSERT INTO usuarios (nombre, email, password_hash, fecha_nacimiento, direccion, telefono, dispositivo_mac) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [nombre, email, usuarioPassword, fechaNacimiento, direccion, telefono, dispositivoMac]
          );
          
          const usuarioId = result.rows[0].id;
          
          // Asignar 1-3 cuidadores aleatoriamente
          const cuidadores = await query('SELECT id FROM cuidadores ORDER BY RANDOM() LIMIT $1', [1 + Math.floor(Math.random() * 3)]);
          
          for (const cuidador of cuidadores.rows) {
            await query(
              'INSERT INTO usuario_cuidador (usuario_id, cuidador_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [usuarioId, cuidador.id]
            );
          }

          const edad = 2026 - parseInt(fechaNacimiento.split('-')[0]);
          console.log(`   ✅ ${nombre} (${edad} años)`);
          console.log(`      📧 ${email}`);
          console.log(`      📞 ${telefono}`);
          console.log(`      🏠 ${direccion}`);
          console.log(`      📟 Dispositivo MAC: ${dispositivoMac}`);
          console.log(`      👥 ${cuidadores.rows.length} cuidador(es) asignado(s)\n`);
          usuariosCreados++;
        }
      } catch (error: any) {
        console.error(`   ❌ Error con ${nombre}: ${error.message}\n`);
      }
    }

    console.log('─'.repeat(70));
    console.log(`📊 Total usuarios creados: ${usuariosCreados}/20\n`);
    console.log('='.repeat(70) + '\n');

    // ===== RESUMEN FINAL =====
    console.log('🎉 RESUMEN FINAL\n');
    console.log(`   ✅ Cuidadores: ${cuidadoresCreados} nuevos`);
    console.log(`   ✅ Usuarios: ${usuariosCreados} nuevos`);
    console.log(`   🔑 Password cuidadores: Cuidador2024!`);
    console.log(`   🔑 Password usuarios: Usuario2024!\n`);
    console.log('='.repeat(70) + '\n');
    console.log('✨ Datos insertados exitosamente!\n');

  } catch (error) {
    console.error('❌ Error general:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Ejecutar
seedExtendedData().catch(console.error);
