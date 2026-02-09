import path from 'path';
import dotenv from 'dotenv';

// Load env vars explicitly from backend/.env
const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

import { query } from '../config/database';

async function runMigration() {
  try {
    console.log('DB Config:', {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        db: process.env.DB_NAME
    });

    console.log('Running migration: Add foto_perfil to cuidadores table...');
    
    await query(`
      ALTER TABLE cuidadores 
      ADD COLUMN IF NOT EXISTS foto_perfil TEXT;
    `);

    console.log('✅ Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
