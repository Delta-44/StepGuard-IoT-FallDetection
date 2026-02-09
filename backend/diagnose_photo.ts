import { query } from './src/config/database';
import pool from './src/config/database';

async function diagnose() {
  console.log('🔍 Starting Photo Upload Diagnosis (Transpile Only)...');
  try {
    // 1. Check database columns
    console.log('\n--- Checking Database Columns ---');
    const colsUsuarios = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'foto_perfil'");
    console.log('Usuarios foto_perfil exists:', (colsUsuarios.rowCount || 0) > 0);

    const colsCuidadores = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'cuidadores' AND column_name = 'foto_perfil'");
    console.log('Cuidadores foto_perfil exists:', (colsCuidadores.rowCount || 0) > 0);

    // 2. Check a sample user (ID 13)
    const userId = 13;
    console.log(`\n--- Checking User ID ${userId} ---`);
    const userRes = await query("SELECT id, nombre, email, 'usuario' as source FROM usuarios WHERE id = $1 UNION SELECT id, nombre, email, 'cuidador' as source FROM cuidadores WHERE id = $1", [userId]);
    if (userRes.rowCount === 0) {
      console.log('❌ User not found in either table');
    } else {
      console.log('✅ User found:', userRes.rows[0]);
    }

  } catch (err: any) {
    console.error('❌ Diagnostic failed:', err.message);
  } finally {
    await pool.end();
  }
}

diagnose();
