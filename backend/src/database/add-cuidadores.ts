import bcrypt from 'bcryptjs';
import { CuidadorModel } from '../models/cuidador';
import pool from '../config/database';

const nombres = [
  'Ana García', 'Carlos Rodríguez', 'María López', 'Juan Martínez', 'Laura Sánchez',
  'Pedro Fernández', 'Carmen Díaz', 'Antonio Pérez', 'Isabel Torres', 'Francisco Ruiz',
  'Elena Jiménez', 'Miguel Moreno', 'Rosa Álvarez', 'José Romero', 'Lucía Navarro',
  'Manuel Domínguez', 'Pilar Gil', 'Alberto Vázquez', 'Teresa Serrano', 'Rafael Ramos',
  'Patricia Molina', 'Javier Castro', 'Cristina Ortega', 'Daniel Delgado', 'Silvia Marín',
  'Roberto Rubio', 'Mercedes Núñez', 'Sergio Iglesias', 'Beatriz Medina', 'Fernando Garrido'
];

const generarTelefono = (): string => {
  const prefijos = ['600', '610', '620', '630', '640', '650', '660', '670', '680', '690'];
  const prefijo = prefijos[Math.floor(Math.random() * prefijos.length)];
  const numero = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${prefijo}${numero}`;
};

const addCuidadores = async () => {
  try {
    console.log('🚀 Iniciando proceso de creación de cuidadores...\n');

    // Contraseña por defecto para todos: "Cuidador123"
    const defaultPassword = 'Cuidador123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    let creados = 0;
    let existentes = 0;

    for (let i = 0; i < nombres.length; i++) {
      const nombre = nombres[i];
      const email = `${nombre.toLowerCase().replace(/\s+/g, '.').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@cuidadores.com`;
      const telefono = generarTelefono();
      const isAdmin = i < 3; // Los primeros 3 serán administradores

      try {
        // Verificar si ya existe
        const existente = await CuidadorModel.findByEmail(email);
        
        if (existente) {
          console.log(`⚠️  Cuidador ya existe: ${nombre} (${email})`);
          existentes++;
        } else {
          await CuidadorModel.create(nombre, email, passwordHash, telefono, isAdmin);
          console.log(`✅ Creado: ${nombre} ${isAdmin ? '(Admin)' : ''}`);
          console.log(`   Email: ${email}`);
          console.log(`   Teléfono: ${telefono}\n`);
          creados++;
        }
      } catch (error: any) {
        console.error(`❌ Error creando ${nombre}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Resumen:`);
    console.log(`   ✅ Cuidadores creados: ${creados}`);
    console.log(`   ⚠️  Ya existían: ${existentes}`);
    console.log(`   📝 Total procesados: ${nombres.length}`);
    console.log('='.repeat(60));
    console.log(`\n💡 Contraseña para todos: ${defaultPassword}`);
    console.log(`\n🎉 Proceso completado exitosamente!`);

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

// Ejecutar
addCuidadores();
