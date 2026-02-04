import { query } from './config/database';
import pool from './config/database';

async function finalUpdate() {
  console.log('Final attempt to update schema...');
  try {
    await query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);');
    await query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;');
    console.log('Schema update queries executed.');
  } catch (err: any) {
    if (err.code === '42701') { // Duplicate column
      console.log('Columns already exist.');
    } else {
      console.error('Error updating schema:', err);
    }
  } finally {
    await pool.end();
  }
}

finalUpdate();
