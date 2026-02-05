import { query } from './config/database';
import bcrypt from 'bcryptjs';

async function checkAndCreateUser() {
  try {
    console.log('Verificando si existe usuario con email carloslorenzovillar0@gmail.com...');
    
    // Buscar en usuarios
    let result = await query(
      'SELECT * FROM usuarios WHERE email = $1',
      ['carloslorenzovillar0@gmail.com']
    );

    if (result.rows.length > 0) {
      console.log('✓ Usuario encontrado en tabla usuarios');
      console.log('  Nombre:', result.rows[0].nombre);
      console.log('  Email:', result.rows[0].email);
      return;
    }

    // Buscar en cuidadores
    result = await query(
      'SELECT * FROM cuidadores WHERE email = $1',
      ['carloslorenzovillar0@gmail.com']
    );

    if (result.rows.length > 0) {
      console.log('✓ Usuario encontrado en tabla cuidadores');
      console.log('  Nombre:', result.rows[0].nombre);
      console.log('  Email:', result.rows[0].email);
      return;
    }

    // Si no existe, crear usuario de prueba
    console.log('⚠ Usuario no encontrado. Creando usuario de prueba...');
    const passwordHash = await bcrypt.hash('test123', 10);
    
    result = await query(
      'INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      ['Carlos Lorenzo', 'carloslorenzovillar0@gmail.com', passwordHash]
    );

    console.log('✓ Usuario creado exitosamente');
    console.log('  Nombre:', result.rows[0].nombre);
    console.log('  Email:', result.rows[0].email);
    console.log('  Password temporal: test123');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAndCreateUser();
