// test/jest.setup.ts

// 1. Aumentar el timeout para procesos asíncronos
jest.setTimeout(30000);

// 2. Mock Global de Redis (Evita el error "Cannot log after tests are done")
jest.mock('../src/config/redis', () => ({
  redis: {
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
  },
}));

// 3. Variables de entorno para test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_123';
process.env.GOOGLE_CLIENT_ID = 'mock_client_id';

// 4. Limpieza global
afterAll(async () => {
  // Aquí podrías cerrar pools de conexiones si no estuvieran mockeados
});

console.log('✅ Jest setup cargado correctamente (Redis Mocked)');