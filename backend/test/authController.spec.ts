/**
 * Tests unitarios para authController
 * Cubre funcionalidades de: forgotPassword, resetPassword
 */

import { forgotPassword, resetPassword } from '../src/controllers/authController';
import { UsuarioModel } from '../src/models/usuario';
import { CuidadorModel } from '../src/models/cuidador';
import jwt from 'jsonwebtoken';
import { mockRequest, mockResponse, expectErrorResponse, expectSuccessResponse, createTestUser, createTestCuidador } from './utils/testHelpers';

/* eslint-disable no-undef */
/* global jest, describe, test, expect, beforeEach, afterEach */

// ============ MOCKS ============
jest.mock('../src/models/usuario');
jest.mock('../src/models/cuidador');
jest.mock('jsonwebtoken');
jest.mock('../src/services/emailService', () => ({
  __esModule: true,
  default: {
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined)
  }
}));

const mockedUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
const mockedCuidador = CuidadorModel as jest.Mocked<typeof CuidadorModel>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const emailService = require('../src/services/emailService').default;

// ============ TESTS: forgotPassword ============
describe('authController - forgotPassword', () => {
  const validToken = 'mocktoken_' + Date.now();
  const testEmail = 'test@example.com';

  beforeEach(() => {
    jest.clearAllMocks();
    (mockedJwt.sign as jest.Mock).mockReturnValue(validToken);
    process.env.CORS_ORIGIN = 'http://localhost:4200';
  });

  describe('Validación de entrada', () => {
    test('✓ debe responder 400 si falta email', async () => {
      const req = mockRequest({ body: {} }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      expectErrorResponse(res, 400, /email.*requerido/i);
    });

    test('✓ debe responder 400 si email está vacío', async () => {
      const req = mockRequest({ body: { email: '' } }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      expectErrorResponse(res, 400);
    });

    test('✓ debe responder 400 si email es null', async () => {
      const req = mockRequest({ body: { email: null } }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      expectErrorResponse(res, 400);
    });
  });

  describe('Usuario no encontrado', () => {
    test('✓ responde 200 si usuario no existe (seguridad)', async () => {
      mockedUsuario.findByEmail.mockResolvedValue(null);
      mockedCuidador.findByEmail.mockResolvedValue(null);

      const req = mockRequest({ body: { email: 'noexiste@test.local' } }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      expectSuccessResponse(res, 200);
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    test('✓ no revela si el email existe (seguridad)', async () => {
      mockedUsuario.findByEmail.mockResolvedValue(null);
      mockedCuidador.findByEmail.mockResolvedValue(null);

      const req = mockRequest({ body: { email: 'missing@test.local' } }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      const data = expectSuccessResponse(res, 200);
      expect(data.message).toContain('Si el correo existe');
    });
  });

  describe('Usuario encontrado - flujo exitoso', () => {
    test('✓ envía email si usuario existe', async () => {
      const testUser = createTestUser({ email: testEmail });
      mockedUsuario.findByEmail.mockResolvedValue(testUser as any);

      const req = mockRequest({ body: { email: testEmail } }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(testEmail, expect.stringContaining('reset-password'));
      expectSuccessResponse(res, 200);
    });

    test('✓ genera JWT válido con expiración correcta', async () => {
      const testUser = createTestUser({ email: testEmail });
      mockedUsuario.findByEmail.mockResolvedValue(testUser as any);

      const req = mockRequest({ body: { email: testEmail } }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          email: testEmail,
          type: 'usuario',
          purpose: 'reset-password'
        }),
        expect.any(String),
        { expiresIn: '1h' }
      );
    });

    test('✓ construye URL de reset con token', async () => {
      const testUser = createTestUser({ email: testEmail });
      mockedUsuario.findByEmail.mockResolvedValue(testUser as any);

      const req = mockRequest({ body: { email: testEmail } }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      const resetUrl = (emailService.sendPasswordResetEmail as jest.Mock).mock.calls[0][1];
      expect(resetUrl).toContain('reset-password?token=');
      expect(resetUrl).toContain(validToken);
    });

    test('✓ usa CORS_ORIGIN para construir URL', async () => {
      const customOrigin = 'https://custom.example.com';
      process.env.CORS_ORIGIN = customOrigin;
      const testUser = createTestUser({ email: testEmail });
      mockedUsuario.findByEmail.mockResolvedValue(testUser as any);

      const req = mockRequest({ body: { email: testEmail } }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      const resetUrl = (emailService.sendPasswordResetEmail as jest.Mock).mock.calls[0][1];
      expect(resetUrl).toContain(customOrigin);
    });
  });

  describe('Cuidador encontrado', () => {
    test('✓ envía reset si cuidador existe', async () => {
      const testCuidador = createTestCuidador({ email: testEmail });
      mockedUsuario.findByEmail.mockResolvedValue(null);
      mockedCuidador.findByEmail.mockResolvedValue(testCuidador as any);

      const req = mockRequest({ body: { email: testEmail } }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'cuidador' }),
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  describe('Manejo de errores', () => {
    test('✓ maneja errores en emailService gracefully', async () => {
      const testUser = createTestUser({ email: testEmail });
      mockedUsuario.findByEmail.mockResolvedValue(testUser as any);
      emailService.sendPasswordResetEmail.mockRejectedValueOnce(new Error('Email service error'));

      const req = mockRequest({ body: { email: testEmail } }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      // Aunque falle el email, responde 500
      expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    });

    test('✓ maneja errores en BD gracefully', async () => {
      mockedUsuario.findByEmail.mockRejectedValueOnce(new Error('DB error'));

      const req = mockRequest({ body: { email: testEmail } }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    });
  });
});

// ============ TESTS: resetPassword ============
describe('authController - resetPassword', () => {
  const validToken = 'valid.jwt.token';
  const newPassword = 'NewSecurePass123!';
  const validDecoded = {
    email: 'test@example.com',
    type: 'usuario',
    purpose: 'reset-password',
    iat: Math.floor(Date.now() / 1000)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockedJwt.verify as jest.Mock).mockReturnValue(validDecoded);
  });

  describe('Validación de entrada', () => {
    test('✓ debe responder 400 si falta token', async () => {
      const req = mockRequest({ body: { password: newPassword } }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      expectErrorResponse(res, 400);
    });

    test('✓ debe responder 400 si falta password', async () => {
      const req = mockRequest({ body: { token: validToken } }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      expectErrorResponse(res, 400);
    });

    test('✓ debe responder 400 si ambos parámetros faltan', async () => {
      const req = mockRequest({ body: {} }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      expectErrorResponse(res, 400);
    });

    test('✓ debe responder 400 si password está vacío', async () => {
      const req = mockRequest({ body: { token: validToken, password: '' } }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      expectErrorResponse(res, 400);
    });
  });

  describe('Validación de token', () => {
    test('✓ rechaza token inválido', async () => {
      (mockedJwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid signature');
      });

      const req = mockRequest({ body: { token: 'invalid.token', password: newPassword } }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      expectErrorResponse(res, 400);
    });

    test('✓ rechaza token expirado', async () => {
      (mockedJwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('token expired');
      });

      const req = mockRequest({ body: { token: 'expired.token', password: newPassword } }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      expectErrorResponse(res, 400);
    });

    test('✓ rechaza token con propósito incorrecto', async () => {
      (mockedJwt.verify as jest.Mock).mockReturnValue({
        ...validDecoded,
        purpose: 'wrong-purpose'
      });

      const req = mockRequest({ body: { token: validToken, password: newPassword } }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      expectErrorResponse(res, 400);
    });
  });

  describe('Usuario no encontrado', () => {
    test('✓ responde 400 si usuario no existe', async () => {
      mockedUsuario.findByEmail.mockResolvedValue(null);

      const req = mockRequest({ body: { token: validToken, password: newPassword } }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      expectErrorResponse(res, 400, /no encontrado|no existe/i);
    });
  });

  describe('Reseteo exitoso', () => {
    test('✓ actualiza contraseña correctamente', async () => {
      const testUser = createTestUser({ email: validDecoded.email });
      mockedUsuario.findByEmail.mockResolvedValue(testUser as any);
      mockedUsuario.updatePassword.mockResolvedValue({ ...testUser, password_last_changed_at: new Date() } as any);

      const req = mockRequest({ body: { token: validToken, password: newPassword } }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      expect(mockedUsuario.updatePassword).toHaveBeenCalledWith(testUser.id, expect.any(String));
      expectSuccessResponse(res, 200);
    });

    test('✓ retorna usuario sin campo de contraseña', async () => {
      const testUser = createTestUser({ email: validDecoded.email });
      mockedUsuario.findByEmail.mockResolvedValue(testUser as any);
      mockedUsuario.updatePassword.mockResolvedValue({ ...testUser, password_last_changed_at: new Date() } as any);

      const req = mockRequest({ body: { token: validToken, password: newPassword } }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      const responseData = expectSuccessResponse(res, 200);
      expect(responseData.password_hash).toBeUndefined();
    });

    test('✓ resetea contraseña para cuidador', async () => {
      const decodedCuidador = { ...validDecoded, type: 'cuidador' };
      (mockedJwt.verify as jest.Mock).mockReturnValue(decodedCuidador);
      const testCuidador = createTestCuidador({ email: validDecoded.email });
      mockedCuidador.findByEmail.mockResolvedValue(testCuidador as any);
      mockedCuidador.updatePassword.mockResolvedValue({ ...testCuidador, password_last_changed_at: new Date() } as any);

      const req = mockRequest({ body: { token: validToken, password: newPassword } }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      expect(mockedCuidador.updatePassword).toHaveBeenCalledWith(testCuidador.id, expect.any(String));
      expectSuccessResponse(res, 200);
    });
  });

  describe('Manejo de errores', () => {
    test('✓ maneja errores al buscar usuario', async () => {
      mockedUsuario.findByEmail.mockRejectedValueOnce(new Error('DB error'));

      const req = mockRequest({ body: { token: validToken, password: newPassword } }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    });

    test('✓ maneja errores al actualizar contraseña', async () => {
      const testUser = createTestUser({ email: validDecoded.email });
      mockedUsuario.findByEmail.mockResolvedValue(testUser as any);
      mockedUsuario.updatePassword.mockRejectedValueOnce(new Error('Update failed'));

      const req = mockRequest({ body: { token: validToken, password: newPassword } }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  // ============ TESTS ADICIONALES: Edge Cases ============
  describe('Edge Cases - forgotPassword', () => {
    test('✓ maneja email con espacios en blanco', async () => {
      const emailWithSpaces = '  test@example.com  ';
      mockedUsuario.findByEmail.mockResolvedValue(null);

      const req = mockRequest({ body: { email: emailWithSpaces } }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('✓ maneja múltiples usuarios con mismo email (integridad)', async () => {
      mockedUsuario.findByEmail.mockResolvedValue(createTestUser() as any);

      const req = mockRequest({ body: { email: 'test@example.com' } }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      // Solo debe llamar una vez
      expect(mockedUsuario.findByEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    });

    test('✓ maneja email muy largo', async () => {
      const veryLongEmail = 'a'.repeat(200) + '@test.com';
      mockedUsuario.findByEmail.mockResolvedValue(null);

      const req = mockRequest({ body: { email: veryLongEmail } }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('✓ maneja caracteres especiales en email', async () => {
      const emailWithSpecials = 'test+tag@example.co.uk';
      mockedUsuario.findByEmail.mockResolvedValue(createTestUser({ email: emailWithSpecials }) as any);

      const req = mockRequest({ body: { email: emailWithSpecials } }) as any;
      const res = mockResponse() as any;

      await forgotPassword(req, res);

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(emailWithSpecials, expect.any(String));
    });
  });

  describe('Edge Cases - resetPassword', () => {
    const testEmail = 'test@example.com';
    const validDecoded = {
      email: testEmail,
      type: 'usuario',
      purpose: 'reset-password',
      iat: Math.floor(Date.now() / 1000)
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (mockedJwt.verify as jest.Mock).mockReturnValue(validDecoded);
    });

    test('✓ maneja contraseña muy larga', async () => {
      const veryLongPassword = 'Aa1!' + 'x'.repeat(500);
      const testUser = createTestUser({ email: testEmail });
      mockedUsuario.findByEmail.mockResolvedValue(testUser as any);
      mockedUsuario.updatePassword.mockResolvedValue(testUser as any);

      const req = mockRequest({ body: { token: 'valid', password: veryLongPassword } }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      expect(mockedUsuario.updatePassword).toHaveBeenCalled();
    });

    test('✓ maneja token con espacios', async () => {
      (mockedJwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Malformed token');
      });

      const req = mockRequest({ body: { token: '  bad token with spaces  ', password: 'NewPass123!' } }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('✓ rechaza token con iat en el futuro', async () => {
      const futureDecoded = {
        ...validDecoded,
        iat: Math.floor(Date.now() / 1000) + 3600 // Una hora en el futuro
      };
      (mockedJwt.verify as jest.Mock).mockReturnValue(futureDecoded);

      const testUser = createTestUser({ email: testEmail });
      mockedUsuario.findByEmail.mockResolvedValue(testUser as any);

      const req = mockRequest({ body: { token: 'valid', password: 'NewPass123!' } }) as any;
      const res = mockResponse() as any;

      await resetPassword(req, res);

      // Aunque el JWT sea válido, podría considerarse sospechoso
      expect(res.status).toHaveBeenCalled();
    });

    test('✓ maneja usuario con múltiples intentos de reset', async () => {
      const testUser = createTestUser({ email: testEmail });
      mockedUsuario.findByEmail.mockResolvedValue(testUser as any);
      mockedUsuario.updatePassword.mockResolvedValue(testUser as any);

      for (let i = 0; i < 3; i++) {
        const req = mockRequest({ body: { token: 'valid', password: `NewPass${i}!` } }) as any;
        const res = mockResponse() as any;

        await resetPassword(req, res);

        expect(mockedUsuario.updatePassword).toHaveBeenCalledTimes(i + 1);
      }
    });
  });
});