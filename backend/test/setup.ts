// Setup global para pruebas - se ejecuta antes de todos los tests
import dotenv from 'dotenv';

// Cargar variables de entorno para tests
dotenv.config({ path: '.env.test' });

// Variables de entorno por defecto para tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';
process.env.NODE_ENV = 'test';

// Aumentar timeout de jest para pruebas de BD
jest.setTimeout(10000);

// Suprimir logs durante tests (opcional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Mantener error para debugging
  error: console.error,
};
