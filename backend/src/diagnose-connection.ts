import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

/**
 * Script de diagnóstico para problemas de conexión
 * Verifica la configuración antes de intentar conectar
 */
function runDiagnostics() {
  console.log('🔍 DIAGNÓSTICO DE CONFIGURACIÓN\n');
  console.log('=' .repeat(60));
  
  const issues: string[] = [];
  const warnings: string[] = [];

  // ===== VERIFICAR ARCHIVO .env =====
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    issues.push('❌ El archivo .env NO existe');
    console.log('\n❌ ERROR CRÍTICO: No se encontró el archivo .env');
    console.log('   📍 Ubicación esperada:', envPath);
    console.log('   ✅ Solución: Copia .env.example a .env');
    console.log('      cd backend');
    console.log('      Copy-Item .env.example .env    # Windows');
    console.log('      cp .env.example .env           # macOS/Linux\n');
  } else {
    console.log('✅ Archivo .env encontrado\n');
  }

  // ===== VERIFICAR POSTGRESQL =====
  console.log('📊 POSTGRESQL');
  console.log('-'.repeat(60));
  
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT;
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;

  if (!dbHost || dbHost === 'localhost' || dbHost === '') {
    warnings.push('⚠️  DB_HOST está vacío o es localhost (¿usas Docker?)');
    console.log('⚠️  DB_HOST:', dbHost || '(vacío)');
    console.log('   Si quieres conectar a Neon, debe ser algo como:');
    console.log('   ep-xxxxx-xxxxx.us-east-2.aws.neon.tech\n');
  } else {
    console.log('✅ DB_HOST:', dbHost);
    
    if (dbHost.includes('neon.tech')) {
      console.log('   🎯 Detectado: Neon PostgreSQL (SSL habilitado)\n');
    } else if (dbHost.includes('supabase')) {
      console.log('   🎯 Detectado: Supabase PostgreSQL (SSL habilitado)\n');
    } else {
      console.log('   ℹ️  Host personalizado\n');
    }
  }

  if (!dbPort) {
    issues.push('❌ DB_PORT no está configurado');
  } else {
    console.log('✅ DB_PORT:', dbPort);
  }

  if (!dbName) {
    issues.push('❌ DB_NAME no está configurado');
  } else {
    console.log('✅ DB_NAME:', dbName);
  }

  if (!dbUser) {
    issues.push('❌ DB_USER no está configurado');
  } else {
    console.log('✅ DB_USER:', dbUser);
  }

  if (!dbPassword || dbPassword === 'postgres') {
    warnings.push('⚠️  DB_PASSWORD parece ser la contraseña por defecto');
    console.log('⚠️  DB_PASSWORD:', dbPassword ? '(configurado - pero es default?)' : '(vacío)');
  } else {
    console.log('✅ DB_PASSWORD: ********** (configurado)');
  }

  console.log('\n');

  // ===== VERIFICAR REDIS =====
  console.log('🔴 REDIS');
  console.log('-'.repeat(60));
  
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;
  const redisPassword = process.env.REDIS_PASSWORD;

  if (!redisHost || redisHost === 'localhost' || redisHost === '') {
    warnings.push('⚠️  REDIS_HOST está vacío o es localhost (¿usas Docker?)');
    console.log('⚠️  REDIS_HOST:', redisHost || '(vacío)');
    console.log('   Si quieres conectar a Redis Cloud/Upstash, debe ser algo como:');
    console.log('   redis-12345.c293.eu-central-1-1.ec2.cloud.redislabs.com\n');
  } else {
    console.log('✅ REDIS_HOST:', redisHost);
    
    if (redisHost.includes('upstash.io')) {
      console.log('   🎯 Detectado: Upstash Redis');
      if (redisPort === '6380') {
        console.log('   ✅ Puerto 6380 - TLS habilitado automáticamente\n');
      } else {
        console.log('   ℹ️  Puerto', redisPort, '- sin TLS\n');
      }
    } else if (redisHost.includes('redislabs.com')) {
      console.log('   🎯 Detectado: Redis Cloud');
      console.log('   ℹ️  Puertos personalizados normalmente NO usan TLS\n');
    } else {
      console.log('   ℹ️  Host personalizado\n');
    }
  }

  if (!redisPort) {
    issues.push('❌ REDIS_PORT no está configurado');
  } else {
    console.log('✅ REDIS_PORT:', redisPort);
    if (redisPort === '6380') {
      console.log('   ℹ️  Puerto 6380 típicamente usa TLS/SSL');
    }
  }

  if (!redisPassword) {
    warnings.push('⚠️  REDIS_PASSWORD está vacío');
    console.log('⚠️  REDIS_PASSWORD: (vacío)');
    console.log('   Esto funciona para Redis local sin contraseña');
  } else {
    console.log('✅ REDIS_PASSWORD: ********** (configurado)');
  }

  console.log('\n');

  // ===== VERIFICAR JWT =====
  console.log('🔐 JWT');
  console.log('-'.repeat(60));
  
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.includes('cambiar')) {
    warnings.push('⚠️  JWT_SECRET parece ser el valor por defecto');
    console.log('⚠️  JWT_SECRET: (valor por defecto - cámbialo en producción)');
  } else {
    console.log('✅ JWT_SECRET: ********** (configurado)');
  }

  console.log('\n');

  // ===== RESUMEN =====
  console.log('=' .repeat(60));
  console.log('📋 RESUMEN\n');

  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ ¡Todo parece estar configurado correctamente!');
    console.log('\n🚀 Próximo paso: Ejecuta npm run db:test para probar las conexiones\n');
  } else {
    if (issues.length > 0) {
      console.log('❌ ERRORES CRÍTICOS:');
      issues.forEach(issue => console.log('   ' + issue));
      console.log('');
    }

    if (warnings.length > 0) {
      console.log('⚠️  ADVERTENCIAS:');
      warnings.forEach(warning => console.log('   ' + warning));
      console.log('');
    }

    console.log('📖 Lee la guía completa en: backend/src/database/GUIDE-CONECTION.md');
    console.log('🚀 Cuando corrijas los errores, ejecuta: npm run db:test\n');
  }

  // ===== MODO DE CONEXIÓN =====
  console.log('🔌 MODO DE CONEXIÓN DETECTADO:');
  if ((dbHost === 'localhost' || !dbHost) && (redisHost === 'localhost' || !redisHost)) {
    console.log('   🏠 LOCAL - Usando Docker (asegúrate de que docker-compose está corriendo)');
  } else if ((dbHost !== 'localhost' && dbHost) && (redisHost === 'localhost' || !redisHost)) {
    console.log('   🔀 MIXTO - PostgreSQL remoto + Redis local');
  } else if ((dbHost === 'localhost' || !dbHost) && (redisHost !== 'localhost' && redisHost)) {
    console.log('   🔀 MIXTO - PostgreSQL local + Redis remoto');
  } else {
    console.log('   ☁️  REMOTO - Usando bases de datos en la nube');
  }

  console.log('=' .repeat(60) + '\n');
}

// Ejecutar diagnósticos
runDiagnostics();
