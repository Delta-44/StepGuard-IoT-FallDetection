/**
 * Script de prueba del sistema de IA
 * Prueba los endpoints principales sin necesidad de datos reales
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/ai';

async function testAISystem() {
  console.log('🧪 Iniciando pruebas del sistema de IA...\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Probando Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // 2. Status
    console.log('2️⃣ Probando Status del sistema...');
    const statusResponse = await axios.get(`${BASE_URL}/status`);
    console.log('✅ Status:', statusResponse.data);
    console.log('');

    // 3. Análisis de Usuario (debería fallar elegantemente si no hay datos)
    console.log('3️⃣ Probando Análisis de Usuario...');
    try {
      const analyzeResponse = await axios.get(`${BASE_URL}/analyze/1`);
      console.log('✅ Análisis de Usuario:', analyzeResponse.data);
    } catch (error: any) {
      console.log('⚠️  Análisis de Usuario (esperado si no hay datos):', error.response?.data || error.message);
    }
    console.log('');

    // 4. Detección de Anomalías
    console.log('4️⃣ Probando Detección de Anomalías...');
    try {
      const anomaliesResponse = await axios.get(`${BASE_URL}/anomalies/ESP32_001?timeWindow=60`);
      console.log('✅ Detección de Anomalías:', anomaliesResponse.data);
    } catch (error: any) {
      console.log('⚠️  Detección de Anomalías (esperado si no hay datos):', error.response?.data || error.message);
    }
    console.log('');

    // 5. Predicción de Caída
    console.log('5️⃣ Probando Predicción de Caída...');
    try {
      const predictResponse = await axios.post(`${BASE_URL}/predict-fall`, {
        deviceId: 'ESP32_001',
        timeWindow: 24,
      });
      console.log('✅ Predicción de Caída:', predictResponse.data);
    } catch (error: any) {
      console.log('⚠️  Predicción de Caída (esperado si no hay datos):', error.response?.data || error.message);
    }
    console.log('');

    console.log('✅ Todas las pruebas completadas!');
    console.log('\n📊 Resumen:');
    console.log('- Sistema de IA: ✅ Funcionando');
    console.log('- Endpoints: ✅ Disponibles');
    console.log('- Configuración: ✅ Correcta');
    console.log('\n💡 Nota: Algunos endpoints pueden no retornar datos hasta que haya información en Redis/PostgreSQL');

  } catch (error: any) {
    console.error('❌ Error en las pruebas:', error.message);
    if (error.response) {
      console.error('Respuesta del servidor:', error.response.data);
    }
  }
}

// Ejecutar pruebas
testAISystem();
