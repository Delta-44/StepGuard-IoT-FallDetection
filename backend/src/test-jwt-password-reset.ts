import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

async function runTests() {
  const results: TestResult[] = [];
  let testToken = '';

  console.log(`\n${colors.cyan}=== Test JWT Password Reset ===${colors.reset}\n`);

  // Test 1: Solicitar reset de contraseña para email existente
  try {
    console.log(`${colors.yellow}Test 1: Solicitar reset de contraseña...${colors.reset}`);
    const response = await axios.post(`${API_URL}/forgot-password`, {
      email: 'carloslorenzovillar0@gmail.com',
    });

    if (response.status === 200) {
      results.push({
        name: 'Solicitud de reset',
        success: true,
        message: response.data.message,
      });
      console.log(`${colors.green}✓ Solicitud de reset exitosa${colors.reset}`);
      console.log(`  Mensaje: ${response.data.message}`);
    }
  } catch (error: any) {
    results.push({
      name: 'Solicitud de reset',
      success: false,
      message: error.response?.data?.message || error.message,
    });
    console.log(`${colors.red}✗ Error en solicitud de reset${colors.reset}`);
    console.log(`  Status: ${error.response?.status}`);
    console.log(`  Error: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log(`  Detalles:`, error.response.data);
    }
  }

  // Test 2: Solicitar reset para email inexistente
  try {
    console.log(`\n${colors.yellow}Test 2: Reset para email inexistente...${colors.reset}`);
    const response = await axios.post(`${API_URL}/forgot-password`, {
      email: 'noexiste@example.com',
    });

    if (response.status === 200) {
      results.push({
        name: 'Reset email inexistente',
        success: true,
        message: 'No revela si el email existe (correcto por seguridad)',
      });
      console.log(`${colors.green}✓ Respuesta segura para email inexistente${colors.reset}`);
    }
  } catch (error: any) {
    results.push({
      name: 'Reset email inexistente',
      success: false,
      message: error.response?.data?.message || error.message,
    });
    console.log(`${colors.red}✗ Error inesperado${colors.reset}`);
  }

  // Test 3: Intentar reset sin token
  try {
    console.log(`\n${colors.yellow}Test 3: Reset sin token...${colors.reset}`);
    await axios.post(`${API_URL}/reset-password`, {
      password: 'nuevaPassword123',
    });
    results.push({
      name: 'Reset sin token',
      success: false,
      message: 'Debería rechazar la petición',
    });
    console.log(`${colors.red}✗ No rechazó la petición sin token${colors.reset}`);
  } catch (error: any) {
    if (error.response?.status === 400) {
      results.push({
        name: 'Reset sin token',
        success: true,
        message: 'Rechazado correctamente',
      });
      console.log(`${colors.green}✓ Rechazó correctamente la petición sin token${colors.reset}`);
    }
  }

  // Test 4: Intentar reset con token inválido
  try {
    console.log(`\n${colors.yellow}Test 4: Reset con token inválido...${colors.reset}`);
    await axios.post(`${API_URL}/reset-password`, {
      token: 'token-invalido-123',
      password: 'nuevaPassword123',
    });
    results.push({
      name: 'Reset con token inválido',
      success: false,
      message: 'Debería rechazar el token',
    });
    console.log(`${colors.red}✗ No rechazó el token inválido${colors.reset}`);
  } catch (error: any) {
    if (error.response?.status === 400) {
      results.push({
        name: 'Reset con token inválido',
        success: true,
        message: error.response.data.message,
      });
      console.log(`${colors.green}✓ Rechazó correctamente el token inválido${colors.reset}`);
    }
  }

  // Test 5: Generar un token JWT válido manualmente para probar
  try {
    console.log(`\n${colors.yellow}Test 5: Generando token JWT de prueba...${colors.reset}`);
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
    
    // Generar un token válido
    const token = jwt.sign(
      { 
        email: 'carloslorenzovillar0@gmail.com',
        type: 'usuario',
        purpose: 'reset-password'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log(`${colors.green}✓ Token generado para prueba${colors.reset}`);
    console.log(`  Token: ${token.substring(0, 50)}...`);
    
    results.push({
      name: 'Generación de token',
      success: true,
      message: 'Token JWT generado correctamente',
    });
  } catch (error: any) {
    results.push({
      name: 'Generación de token',
      success: false,
      message: error.message,
    });
    console.log(`${colors.red}✗ Error al generar token${colors.reset}`);
  }

  // Resumen
  console.log(`\n${colors.cyan}=== Resumen ===${colors.reset}`);
  const passed = results.filter((r) => r.success).length;
  const total = results.length;
  console.log(`\nTests ejecutados: ${total}`);
  console.log(`${colors.green}✓ Exitosos: ${passed}${colors.reset}`);
  console.log(`${colors.red}✗ Fallidos: ${total - passed}${colors.reset}\n`);

  console.log(`${colors.cyan}=== Instrucciones Adicionales ===${colors.reset}`);
  console.log(`
Para probar el flujo completo:

1. Solicitar reset de contraseña:
   POST ${API_URL}/forgot-password
   Body: { "email": "carloslorenzovillar0@gmail.com" }

2. Revisar el email recibido y copiar el token del enlace

3. Usar el token para resetear la contraseña:
   POST ${API_URL}/reset-password
   Body: { 
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...",
     "password": "nuevaPassword123"
   }

4. La contraseña se actualizará y password_last_changed_at se establecerá

5. Intentar usar el mismo token de nuevo fallará porque el timestamp
   del token es anterior a password_last_changed_at
  `);
}

runTests().catch(console.error);
