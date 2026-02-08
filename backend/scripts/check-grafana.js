#!/usr/bin/env node

/**
 * Script de verificación de Grafana
 * Comprueba que Grafana esté funcionando y conectado a PostgreSQL
 */

const http = require('http');

const GRAFANA_URL = 'http://localhost:3000';
const GRAFANA_USER = process.env.GRAFANA_ADMIN_USER || 'admin';
const GRAFANA_PASSWORD = process.env.GRAFANA_ADMIN_PASSWORD || 'admin123';

console.log('🔍 Verificando Grafana...\n');

// Función helper para hacer peticiones HTTP
function makeRequest(url, auth = false) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      timeout: 5000
    };

    if (auth) {
      const authString = Buffer.from(`${GRAFANA_USER}:${GRAFANA_PASSWORD}`).toString('base64');
      options.headers = {
        'Authorization': `Basic ${authString}`
      };
    }

    http.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    }).on('error', reject).on('timeout', () => {
      reject(new Error('Timeout'));
    });
  });
}

async function checkGrafana() {
  try {
    // 1. Verificar que Grafana responde
    console.log('1️⃣  Verificando conectividad a Grafana...');
    const healthCheck = await makeRequest(`${GRAFANA_URL}/api/health`);
    
    if (healthCheck.statusCode === 200) {
      console.log('   ✅ Grafana está respondiendo en http://localhost:3000\n');
    } else {
      console.log(`   ❌ Grafana respondió con código ${healthCheck.statusCode}\n`);
      return false;
    }

    // 2. Verificar autenticación
    console.log('2️⃣  Verificando credenciales...');
    const authCheck = await makeRequest(`${GRAFANA_URL}/api/org`, true);
    
    if (authCheck.statusCode === 200) {
      console.log(`   ✅ Autenticación exitosa (usuario: ${GRAFANA_USER})\n`);
    } else {
      console.log('   ❌ Error de autenticación. Verifica usuario y contraseña\n');
      return false;
    }

    // 3. Verificar datasources
    console.log('3️⃣  Verificando datasources...');
    const datasourcesCheck = await makeRequest(`${GRAFANA_URL}/api/datasources`, true);
    
    if (datasourcesCheck.statusCode === 200) {
      const datasources = JSON.parse(datasourcesCheck.data);
      const postgresDS = datasources.find(ds => ds.type === 'postgres');
      
      if (postgresDS) {
        console.log(`   ✅ Datasource PostgreSQL encontrado: "${postgresDS.name}"\n`);
      } else {
        console.log('   ⚠️  No se encontró datasource de PostgreSQL\n');
      }
    }

    // 4. Verificar dashboards
    console.log('4️⃣  Verificando dashboards...');
    const dashboardsCheck = await makeRequest(`${GRAFANA_URL}/api/search?type=dash-db`, true);
    
    if (dashboardsCheck.statusCode === 200) {
      const dashboards = JSON.parse(dashboardsCheck.data);
      console.log(`   ✅ ${dashboards.length} dashboard(s) encontrado(s):\n`);
      
      dashboards.forEach(db => {
        console.log(`      📊 ${db.title}`);
      });
      console.log('');
    }

    // Resumen final
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Grafana está funcionando correctamente');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`🌐 Accede en: ${GRAFANA_URL}`);
    console.log(`👤 Usuario: ${GRAFANA_USER}`);
    console.log(`🔐 Contraseña: ${GRAFANA_PASSWORD}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    return true;

  } catch (error) {
    console.log('\n❌ Error al verificar Grafana:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   Grafana no está corriendo en localhost:3000');
      console.log('\n   Solución:');
      console.log('   1. Ejecuta: docker-compose up -d');
      console.log('   2. Espera unos segundos y vuelve a ejecutar este script\n');
    } else if (error.message === 'Timeout') {
      console.log('   Timeout al conectar con Grafana');
      console.log('   Grafana puede estar iniciándose. Espera un momento y reintenta.\n');
    } else {
      console.log(`   ${error.message}\n`);
    }
    
    return false;
  }
}

// Ejecutar verificación
checkGrafana().then(success => {
  process.exit(success ? 0 : 1);
});
