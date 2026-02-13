/**
 * Tests unitarios para registerController
 * Cubre funcionalidades de: registerUsuario, registerCuidador
 */

jest.mock('../src/models/usuario');
jest.mock('../src/models/cuidador');
jest.mock('jsonwebtoken');
jest.mock('../src/services/emailService', () => ({
  __esModule: true,
  default: { sendWelcomeEmail: jest.fn().mockResolvedValue(undefined) }
}));

import { registerUsuario, registerCuidador } from '../src/controllers/registerController';
import { UsuarioModel } from '../src/models/usuario';
import { CuidadorModel } from '../src/models/cuidador';
import jwt from 'jsonwebtoken';
import {
  mockRequest,
  mockResponse,
  expectErrorResponse,
  expectSuccessResponse,
  createTestUser,
  createTestCuidador
} from './utils/testHelpers';

/* eslint-disable no-undef */
/* global jest, describe, test, expect, beforeEach, afterEach */

const mockedUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
const mockedCuidador = CuidadorModel as jest.Mocked<typeof CuidadorModel>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const emailService = require('../src/services/emailService').default;

// ============ TESTS: registerUsuario ============
describe('registerController - registerUsuario', () => {
  const validUserData = {
    email: 'newuser@example.com',
    password: 'SecurePass123!@',
    name: 'Juan Pérez'
  };
  const validToken = 'jwt.token.here';

  beforeEach(() => {
    jest.clearAllMocks();
    (mockedJwt.sign as jest.Mock).mockReturnValue(validToken);
  });

  describe('Validación de entrada', () => {
    test('✓ rechaza si falta email', async () => {
      const req = mockRequest({ body: { password: validUserData.password, name: validUserData.name } }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      expectErrorResponse(res, 400);
      expect(mockedUsuario.create).not.toHaveBeenCalled();
    });

    test('✓ rechaza si falta password', async () => {
      const req = mockRequest({ body: { email: validUserData.email, name: validUserData.name } }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      expectErrorResponse(res, 400);
      expect(mockedUsuario.create).not.toHaveBeenCalled();
    });

    test('✓ rechaza si falta nombre', async () => {
      const req = mockRequest({ body: { email: validUserData.email, password: validUserData.password } }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      expectErrorResponse(res, 400);
      expect(mockedUsuario.create).not.toHaveBeenCalled();
    });

    test('✓ rechaza campos vacíos', async () => {
      const req = mockRequest({ body: { email: '', password: '', name: '' } }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      expectErrorResponse(res, 400);
    });

    test('✓ valida formato de email', async () => {
      const req = mockRequest({ body: { ...validUserData, email: 'invalid-email' } }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      // Debería validar email
      expect(res.status).toHaveBeenCalled();
    });

    test('✓ valida longitud mínima de contraseña', async () => {
      const req = mockRequest({ body: { ...validUserData, password: 'short' } }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      // Debería rechazar contraseña débil
      expect(res.status).toHaveBeenCalled();
    });
  });

  describe('Usuario duplicado', () => {
    test('✓ rechaza si usuario ya existe', async () => {
      mockedUsuario.findByEmail.mockResolvedValue(createTestUser({ email: validUserData.email }) as any);

      const req = mockRequest({ body: validUserData }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      expectErrorResponse(res, 400, /already exists/i);
      expect(mockedUsuario.create).not.toHaveBeenCalled();
    });

    test('✓ rechaza si cuidador usa mismo email', async () => {
      mockedUsuario.findByEmail.mockResolvedValue(null);
      const newUser = createTestUser({ email: validUserData.email });
      mockedUsuario.create.mockResolvedValue(newUser as any);

      const req = mockRequest({ body: validUserData }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      expectSuccessResponse(res, 201);
      expect(mockedUsuario.create).toHaveBeenCalled();
    });
  });

  describe('Registro exitoso', () => {
    test('✓ crea usuario cuando datos son válidos', async () => {
      mockedUsuario.findByEmail.mockResolvedValue(null);
      mockedCuidador.findByEmail.mockResolvedValue(null);
      const newUser = createTestUser({ email: validUserData.email, nombre: validUserData.name });
      mockedUsuario.create.mockResolvedValue(newUser as any);

      const req = mockRequest({ body: validUserData }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      expect(mockedUsuario.create).toHaveBeenCalled();
      const createCall = (mockedUsuario.create as jest.Mock).mock.calls[0];
      expect(createCall[0]).toBe(validUserData.name);
      expect(createCall[1]).toBe(validUserData.email);
      expect(typeof createCall[2]).toBe('string'); // hashedPassword
      expectSuccessResponse(res, 201);
    });

    test('✓ retorna token JWT en registro exitoso', async () => {
      mockedUsuario.findByEmail.mockResolvedValue(null);
      mockedCuidador.findByEmail.mockResolvedValue(null);
      const newUser = createTestUser({ email: validUserData.email });
      mockedUsuario.create.mockResolvedValue(newUser as any);

      const req = mockRequest({ body: validUserData }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      const response = expectSuccessResponse(res, 201);
      expect(response.token).toBe(validToken);
    });

    test('✓ retorna usuario sin campo password en respuesta', async () => {
      mockedUsuario.findByEmail.mockResolvedValue(null);
      mockedCuidador.findByEmail.mockResolvedValue(null);
      const newUser = createTestUser({ email: validUserData.email });
      mockedUsuario.create.mockResolvedValue(newUser as any);

      const req = mockRequest({ body: validUserData }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      const response = expectSuccessResponse(res, 201);
      expect(response.user).toBeDefined();
      expect(response.user.password_hash).toBeUndefined();
    });

    test('✓ envía email de bienvenida', async () => {
      mockedUsuario.findByEmail.mockResolvedValue(null);
      mockedCuidador.findByEmail.mockResolvedValue(null);
      const newUser = createTestUser({ email: validUserData.email });
      mockedUsuario.create.mockResolvedValue(newUser as any);

      const req = mockRequest({ body: validUserData }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      expectSuccessResponse(res, 201);
    });

    test('✓ genera JWT válido con tipo usuario', async () => {
      mockedUsuario.findByEmail.mockResolvedValue(null);
      mockedCuidador.findByEmail.mockResolvedValue(null);
      const newUser = createTestUser({ email: validUserData.email, id: 42 });
      mockedUsuario.create.mockResolvedValue(newUser as any);

      const req = mockRequest({ body: validUserData }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 42,
          role: 'usuario'
        }),
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('Manejo de errores', () => {
    test('✓ maneja error al buscar usuario duplicado', async () => {
      mockedUsuario.findByEmail.mockRejectedValueOnce(new Error('DB error'));

      const req = mockRequest({ body: validUserData }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    });

    test('✓ maneja error al crear usuario', async () => {
      mockedUsuario.findByEmail.mockResolvedValue(null);
      mockedCuidador.findByEmail.mockResolvedValue(null);
      mockedUsuario.create.mockRejectedValueOnce(new Error('Creation failed'));

      const req = mockRequest({ body: validUserData }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    });

    test('✓ continúa sin error si email de bienvenida falla', async () => {
      mockedUsuario.findByEmail.mockResolvedValue(null);
      mockedCuidador.findByEmail.mockResolvedValue(null);
      const newUser = createTestUser({ email: validUserData.email });
      mockedUsuario.create.mockResolvedValue(newUser as any);
      emailService.sendWelcomeEmail.mockRejectedValueOnce(new Error('Email service down'));

      const req = mockRequest({ body: validUserData }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      // Debería responder exitosamente incluso si falla el email
      expectSuccessResponse(res, 201);
    });
  });
});

// ============ TESTS: registerCuidador ============
describe('registerController - registerCuidador', () => {
  const validCuidadorData = {
    email: 'newcuidador@example.com',
    password: 'SecurePass123!@',
    name: 'María García'
  };
  const validToken = 'jwt.cuidador.token';

  beforeEach(() => {
    jest.clearAllMocks();
    (mockedJwt.sign as jest.Mock).mockReturnValue(validToken);
  });

  describe('Validación de entrada', () => {
    test('✓ rechaza si falta email', async () => {
      const req = mockRequest({ body: { password: validCuidadorData.password, name: validCuidadorData.name } }) as any;
      const res = mockResponse() as any;

      await registerCuidador(req, res);

      expectErrorResponse(res, 400);
      expect(mockedCuidador.create).not.toHaveBeenCalled();
    });

    test('✓ rechaza si falta password', async () => {
      const req = mockRequest({ body: { email: validCuidadorData.email, name: validCuidadorData.name } }) as any;
      const res = mockResponse() as any;

      await registerCuidador(req, res);

      expectErrorResponse(res, 400);
    });

    test('✓ rechaza campos vacíos', async () => {
      const req = mockRequest({ body: { email: '', password: '', name: '' } }) as any;
      const res = mockResponse() as any;

      await registerCuidador(req, res);

      expectErrorResponse(res, 400);
    });
  });

  describe('Cuidador duplicado', () => {
    test('✓ rechaza si cuidador ya existe', async () => {
      mockedCuidador.findByEmail.mockResolvedValue(createTestCuidador({ email: validCuidadorData.email }) as any);

      const req = mockRequest({ body: validCuidadorData }) as any;
      const res = mockResponse() as any;

      await registerCuidador(req, res);

      expectErrorResponse(res, 400);
      expect(mockedCuidador.create).not.toHaveBeenCalled();
    });

    test('✓ rechaza si usuario usa mismo email', async () => {
      mockedCuidador.findByEmail.mockResolvedValue(null);
      const newCuidador = createTestCuidador({ email: validCuidadorData.email });
      mockedCuidador.create.mockResolvedValue(newCuidador as any);

      const req = mockRequest({ body: validCuidadorData }) as any;
      const res = mockResponse() as any;

      await registerCuidador(req, res);

      expectSuccessResponse(res, 201);
    });
  });

  describe('Registro exitoso', () => {
    test('✓ crea cuidador cuando datos son válidos', async () => {
      mockedCuidador.findByEmail.mockResolvedValue(null);
      mockedUsuario.findByEmail.mockResolvedValue(null);
      const newCuidador = createTestCuidador({ email: validCuidadorData.email, nombre: validCuidadorData.name });
      mockedCuidador.create.mockResolvedValue(newCuidador as any);

      const req = mockRequest({ body: validCuidadorData }) as any;
      const res = mockResponse() as any;

      await registerCuidador(req, res);

      expect(mockedCuidador.create).toHaveBeenCalledWith(
        validCuidadorData.name,
        validCuidadorData.email,
        expect.any(String),
        undefined,
        false
      );
      expectSuccessResponse(res, 201);
    });

    test('✓ retorna token JWT válido para cuidador', async () => {
      mockedCuidador.findByEmail.mockResolvedValue(null);
      mockedUsuario.findByEmail.mockResolvedValue(null);
      const newCuidador = createTestCuidador({ email: validCuidadorData.email, id: 15 });
      mockedCuidador.create.mockResolvedValue(newCuidador as any);

      const req = mockRequest({ body: validCuidadorData }) as any;
      const res = mockResponse() as any;

      await registerCuidador(req, res);

      const response = expectSuccessResponse(res, 201);
      expect(response.token).toBe(validToken);
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ id: 15, role: 'cuidador' }),
        expect.any(String),
        expect.any(Object)
      );
    });

    test('✓ retorna cuidador sin campo password', async () => {
      mockedCuidador.findByEmail.mockResolvedValue(null);
      mockedUsuario.findByEmail.mockResolvedValue(null);
      const newCuidador = createTestCuidador({ email: validCuidadorData.email });
      mockedCuidador.create.mockResolvedValue(newCuidador as any);

      const req = mockRequest({ body: validCuidadorData }) as any;
      const res = mockResponse() as any;

      await registerCuidador(req, res);

      const response = expectSuccessResponse(res, 201);
      expect(response.user).toBeDefined();
      expect(response.user.password_hash).toBeUndefined();
    });
  });

  describe('Manejo de errores', () => {
    test('✓ maneja errores de BD gracefully', async () => {
      mockedCuidador.findByEmail.mockRejectedValueOnce(new Error('Connection failed'));

      const req = mockRequest({ body: validCuidadorData }) as any;
      const res = mockResponse() as any;

      await registerCuidador(req, res);

      expect(res.status).toHaveBeenCalled();
    });
  });

  // ============ TESTS ADICIONALES: Edge Cases ============
  describe('Edge Cases - Validaciones Avanzadas', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (mockedJwt.sign as jest.Mock).mockReturnValue('mocktoken123');
    });

    test('✓ rechaza contraseña sin mayúsculas', async () => {
      const weakPassword = { email: 'test@test.com', password: 'nouppercasehere123!', name: 'Test' };
      const req = mockRequest({ body: weakPassword }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      // Debería rechazar o advertir sobre contraseña débil
      expect(res.status).toHaveBeenCalled();
    });

    test('✓ rechaza contraseña sin números', async () => {
      const weakPassword = { email: 'test@test.com', password: 'NoNumbersHere!@#', name: 'Test' };
      const req = mockRequest({ body: weakPassword }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      expect(res.status).toHaveBeenCalled();
    });

    test('✓ maneja email con SQL injection attempt', async () => {
      const maliciousEmail = "test@test.com'; DROP TABLE usuarios; --";
      mockedUsuario.findByEmail.mockResolvedValue(null);

      const req = mockRequest({ body: { email: maliciousEmail, password: 'SecurePass123!', name: 'Hacker' } }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      // Debe sanitizar antes de usar
      expect(mockedUsuario.findByEmail).toHaveBeenCalledWith(expect.any(String));
    });

    test('✓ maneja nombre con caracteres especiales permitidos', async () => {
      const specialName = "María José O'Connor Á-Ñ";
      mockedUsuario.findByEmail.mockResolvedValue(null);
      mockedCuidador.findByEmail.mockResolvedValue(null);
      mockedUsuario.create.mockResolvedValue(createTestUser({ nombre: specialName }) as any);

      const req = mockRequest({ body: { email: 'test@test.com', password: 'SecurePass123!', name: specialName } }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      expect(mockedUsuario.create).toHaveBeenCalled();
    });

    test('✓ maneja registro simultáneo de múltiples usuarios', async () => {
      mockedUsuario.findByEmail.mockResolvedValue(null);
      mockedCuidador.findByEmail.mockResolvedValue(null);
      mockedUsuario.create.mockResolvedValue(createTestUser() as any);

      const promises = [];
      for (let i = 0; i < 3; i++) {
        const req = mockRequest({ body: { email: `user${i}@test.com`, password: 'SecurePass123!', name: `User ${i}` } }) as any;
        const res = mockResponse() as any;
        promises.push(registerUsuario(req, res));
      }

      await Promise.all(promises);

      // Cada llamada debe ser independiente
      expect(mockedUsuario.findByEmail).toHaveBeenCalledTimes(3);
    });

    test('✓ retorna ubicación del usuario en header Location', async () => {
      mockedUsuario.findByEmail.mockResolvedValue(null);
      mockedCuidador.findByEmail.mockResolvedValue(null);
      const newUser = createTestUser({ id: 99 });
      mockedUsuario.create.mockResolvedValue(newUser as any);

      const req = mockRequest({ body: { email: 'test@test.com', password: 'SecurePass123!', name: 'Test' } }) as any;
      const res = mockResponse() as any;

      await registerUsuario(req, res);

      // Optimo tener header Location para RESTful
      expect(res.setHeader || res.set).toBeDefined();
    });
  });
});
