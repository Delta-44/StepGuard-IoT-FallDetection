import { query } from '../config/database';
import pool from '../config/database';

async function updateSchema() {
  console.log('Running schema update...');
  try {
    const res1 = await query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255);');
    console.log('Added token column', res1);
    const res2 = await query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;');
    console.log('Added expires column', res2);
    console.log('Schema updated successfully.');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    await pool.end();
  }
}

updateSchema();
