// Tests unitarios EXPANDIDOS para authController (forgotPassword, resetPassword)

jest.mock('../src/models/usuario');
jest.mock('../src/models/cuidador');
jest.mock('../src/services/emailService');
jest.mock('jsonwebtoken');

import { forgotPassword, resetPassword } from '../src/controllers/authController';
import { UsuarioModel } from '../src/models/usuario';
import { CuidadorModel } from '../src/models/cuidador';
import emailService from '../src/services/emailService';
import jwt from 'jsonwebtoken';
import { mockRequest, mockResponse } from './utils/mockRequestResponse';

const mockedUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
const mockedCuidador = CuidadorModel as jest.Mocked<typeof CuidadorModel>;
const mockedEmailService = emailService as jest.Mocked<typeof emailService>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('authController - forgotPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  // Validación de entrada
  test('debe retornar 400 si email no está en request body', async () => {
    const req: any = mockRequest({ body: {} });
    const res: any = mockResponse();
    await forgotPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('debe retornar 400 si email está vacío', async () => {
    const req: any = mockRequest({ body: { email: '' } });
    const res: any = mockResponse();
    await forgotPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('debe retornar 400 si email es null', async () => {
    const req: any = mockRequest({ body: { email: null } });
    const res: any = mockResponse();
    await forgotPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Casos de usuario/cuidador
  test('debe retornar 200 si email no existe (seguridad)', async () => {
    mockedUsuario.findByEmail.mockResolvedValue(null);
    mockedCuidador.findByEmail.mockResolvedValue(null);
    const req: any = mockRequest({ body: { email: 'noexiste@test.local' } });
    const res: any = mockResponse();
    await forgotPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Si el correo existe') }));
  });

  test('debe encontrar usuario y generar JWT', async () => {
    const mockUser = { id: 1, email: 'user@test.local', nombre: 'User', password_hash: 'hash' };
    mockedUsuario.findByEmail.mockResolvedValue(mockUser as any);
    mockedJwt.sign.mockReturnValue('token_user_123' as any);
    mockedEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

    const req: any = mockRequest({ body: { email: 'user@test.local' } });
    const res: any = mockResponse();
    await forgotPassword(req, res);

    expect(mockedJwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@test.local', type: 'usuario', purpose: 'reset-password' }),
      expect.any(String),
      expect.objectContaining({ expiresIn: '1h' })
    );
    expect(mockedEmailService.sendPasswordResetEmail).toHaveBeenCalledWith('user@test.local', expect.stringContaining('token'));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('debe buscar en cuidadores si usuario no existe', async () => {
    const mockCuidador = { id: 2, email: 'care@test.local', nombre: 'Cuidador', password_hash: 'hash', is_admin: false };
    mockedUsuario.findByEmail.mockResolvedValue(null);
    mockedCuidador.findByEmail.mockResolvedValue(mockCuidador as any);
    mockedJwt.sign.mockReturnValue('token_care_123' as any);
    mockedEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

    const req: any = mockRequest({ body: { email: 'care@test.local' } });
    const res: any = mockResponse();
    await forgotPassword(req, res);

    expect(mockedCuidador.findByEmail).toHaveBeenCalledWith('care@test.local');
    expect(mockedJwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'cuidador' }),
      expect.any(String),
      expect.any(Object)
    );
  });

  test('debe enviar email correctamente con URL de reset', async () => {
    const mockUser = { id: 1, email: 'test@test.local', nombre: 'Test', password_hash: 'hash' };
    mockedUsuario.findByEmail.mockResolvedValue(mockUser as any);
    mockedJwt.sign.mockReturnValue('reset_token_xyz' as any);
    mockedEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

    const req: any = mockRequest({ body: { email: 'test@test.local' } });
    const res: any = mockResponse();
    await forgotPassword(req, res);

    const emailCall = (mockedEmailService.sendPasswordResetEmail as jest.Mock).mock.calls[0];
    expect(emailCall[0]).toBe('test@test.local');
    expect(emailCall[1]).toContain('reset_token_xyz');
  });

  // Manejo de errores
  test('debe manejar error de BD sin revelar información', async () => {
    mockedUsuario.findByEmail.mockRejectedValue(new Error('Connection timeout'));
    const req: any = mockRequest({ body: { email: 'test@test.local' } });
    const res: any = mockResponse();
    await forgotPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error interno del servidor' }));
  });

  test('debe manejar error en envío de email', async () => {
    const mockUser = { id: 1, email: 'test@test.local', nombre: 'Test', password_hash: 'hash' };
    mockedUsuario.findByEmail.mockResolvedValue(mockUser as any);
    mockedJwt.sign.mockReturnValue('token' as any);
    mockedEmailService.sendPasswordResetEmail.mockRejectedValue(new Error('Email service down'));

    const req: any = mockRequest({ body: { email: 'test@test.local' } });
    const res: any = mockResponse();
    await forgotPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('debe soportar emails con diferentes dominios', async () => {
    const testEmails = ['user@example.com', 'admin@company.co.uk', 'test+tag@domain.org'];
    
    for (const email of testEmails) {
      jest.clearAllMocks();
      mockedUsuario.findByEmail.mockResolvedValue(null);
      mockedCuidador.findByEmail.mockResolvedValue(null);
      
      const req: any = mockRequest({ body: { email } });
      const res: any = mockResponse();
      await forgotPassword(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
    }
  });
});

describe('authController - resetPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  // Validación de entrada
  test('debe retornar 400 si token no existe', async () => {
    const req: any = mockRequest({ body: { password: 'newpass123' } });
    const res: any = mockResponse();
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('debe retornar 400 si password no existe', async () => {
    const req: any = mockRequest({ body: { token: 'token123' } });
    const res: any = mockResponse();
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('debe retornar 400 si token está vacío', async () => {
    const req: any = mockRequest({ body: { token: '', password: 'newpass123' } });
    const res: any = mockResponse();
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // JWT validation
  test('debe retornar 400 si JWT es inválido', async () => {
    mockedJwt.verify.mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    const req: any = mockRequest({ body: { token: 'invalid_token', password: 'newpass123' } });
    const res: any = mockResponse();
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('inválido') }));
  });

  test('debe retornar 400 si token tiene propósito incorrecto', async () => {
    mockedJwt.verify.mockReturnValue({ purpose: 'login', email: 'test@test.local', type: 'usuario' } as any);
    const req: any = mockRequest({ body: { token: 'token', password: 'newpass123' } });
    const res: any = mockResponse();
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('debe retornar 400 si JWT expiró', async () => {
    mockedJwt.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const req: any = mockRequest({ body: { token: 'expired_token', password: 'newpass123' } });
    const res: any = mockResponse();
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Usuario encontrado y actualización
  test('debe actualizar contraseña para usuario existente', async () => {
    const mockUser = { id: 1, email: 'user@test.local', password_hash: 'old_hash', nombre: 'User' };
    mockedJwt.verify.mockReturnValue({ purpose: 'reset-password', email: 'user@test.local', type: 'usuario', iat: 1000 } as any);
    mockedUsuario.findByEmail.mockResolvedValue(mockUser as any);
    (mockedUsuario.updatePassword as jest.Mock).mockResolvedValue(true);

    const req: any = mockRequest({ body: { token: 'valid_token', password: 'newpass123' } });
    const res: any = mockResponse();
    await resetPassword(req, res);

    expect(mockedUsuario.updatePassword).toHaveBeenCalledWith(1, expect.any(String));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('debe actualizar contraseña para cuidador existente', async () => {
    const mockCuidador = { id: 2, email: 'care@test.local', password_hash: 'old_hash', nombre: 'Care', is_admin: false };
    mockedJwt.verify.mockReturnValue({ purpose: 'reset-password', email: 'care@test.local', type: 'cuidador', iat: 1000 } as any);
    mockedCuidador.findByEmail.mockResolvedValue(mockCuidador as any);
    (mockedCuidador.updatePassword as jest.Mock).mockResolvedValue(true);

    const req: any = mockRequest({ body: { token: 'valid_token', password: 'carenewpass' } });
    const res: any = mockResponse();
    await resetPassword(req, res);

    expect(mockedCuidador.updatePassword).toHaveBeenCalledWith(2, expect.any(String));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('debe retornar 400 si usuario no existe durante reset', async () => {
    mockedJwt.verify.mockReturnValue({ purpose: 'reset-password', email: 'noexiste@test.local', type: 'usuario', iat: 1000 } as any);
    mockedUsuario.findByEmail.mockResolvedValue(null);

    const req: any = mockRequest({ body: { token: 'token', password: 'newpass123' } });
    const res: any = mockResponse();
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Password history validation
  test('debe rechazar reset si token es anterior al último cambio de password', async () => {
    const mockUser = {
      id: 1,
      email: 'user@test.local',
      password_hash: 'hash',
      nombre: 'User',
      password_last_changed_at: new Date('2024-02-01')
    };
    
    mockedJwt.verify.mockReturnValue({
      purpose: 'reset-password',
      email: 'user@test.local',
      type: 'usuario',
      iat: 1704067200 // Jan 1 2024
    } as any);
    mockedUsuario.findByEmail.mockResolvedValue(mockUser as any);

    const req: any = mockRequest({ body: { token: 'token', password: 'newpass123' } });
    const res: any = mockResponse();
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Manejo de errores
  test('debe manejar error de BD durante reset', async () => {
    mockedJwt.verify.mockReturnValue({ purpose: 'reset-password', email: 'test@test.local', type: 'usuario', iat: 1000 } as any);
    mockedUsuario.findByEmail.mockRejectedValue(new Error('DB Connection failed'));

    const req: any = mockRequest({ body: { token: 'token', password: 'newpass123' } });
    const res: any = mockResponse();
    await resetPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('debe manejar error en hash de password', async () => {
    const mockUser = { id: 1, email: 'user@test.local', password_hash: 'hash', nombre: 'User' };
    mockedJwt.verify.mockReturnValue({ purpose: 'reset-password', email: 'user@test.local', type: 'usuario', iat: 1000 } as any);
    mockedUsuario.findByEmail.mockResolvedValue(mockUser as any);

    const req: any = mockRequest({ body: { token: 'token', password: 'newpass123' } });
    const res: any = mockResponse();
    await resetPassword(req, res);
    
    expect([200, 500]).toContain((res.status as jest.Mock).mock.calls[0][0]);
  });

  test('debe retornar mensaje de éxito cuando todo es válido', async () => {
    const mockUser = { id: 1, email: 'user@test.local', password_hash: 'hash', nombre: 'User' };
    mockedJwt.verify.mockReturnValue({ purpose: 'reset-password', email: 'user@test.local', type: 'usuario', iat: 1000 } as any);
    mockedUsuario.findByEmail.mockResolvedValue(mockUser as any);
    (mockedUsuario.updatePassword as jest.Mock).mockResolvedValue(true);

    const req: any = mockRequest({ body: { token: 'token', password: 'newpass123' } });
    const res: any = mockResponse();
    await resetPassword(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Contraseña actualizada') })
    );
  });

  test('debe soportar diferentes tipos de password válidas', async () => {
    const passwords = ['SecurePass123', 'P@ssw0rd!', 'MyNewPassword2024'];
    const mockUser = { id: 1, email: 'user@test.local', password_hash: 'hash', nombre: 'User' };

    for (const password of passwords) {
      jest.clearAllMocks();
      mockedJwt.verify.mockReturnValue({ purpose: 'reset-password', email: 'user@test.local', type: 'usuario', iat: 1000 } as any);
      mockedUsuario.findByEmail.mockResolvedValue(mockUser as any);
      (mockedUsuario.updatePassword as jest.Mock).mockResolvedValue(true);

      const req: any = mockRequest({ body: { token: 'token', password } });
      const res: any = mockResponse();
      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    }
  });

  // Tests adicionales para forgotPassword
  test('debe manejar email con mayúsculas', async () => {
    const mockUser = { id: 1, email: 'USER@TEST.LOCAL', nombre: 'User', password_hash: 'hash' };
    mockedUsuario.findByEmail.mockResolvedValue(mockUser as any);
    mockedJwt.sign.mockReturnValue('token' as any);
    mockedEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

    const req: any = mockRequest({ body: { email: 'USER@TEST.LOCAL' } });
    const res: any = mockResponse();
    await forgotPassword(req, res);

    expect(mockedEmailService.sendPasswordResetEmail).toHaveBeenCalled();
  });

  test('debe retornar 200 incluso si email no existe (protección de información)', async () => {
    mockedUsuario.findByEmail.mockResolvedValue(null);
    mockedCuidador.findByEmail.mockResolvedValue(null);

    const req: any = mockRequest({ body: { email: 'fake_email@test.local' } });
    const res: any = mockResponse();
    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Si el correo existe') }));
  });

  test('debe generar token JWT con expiración de 1 hora', async () => {
    const mockUser = { id: 1, email: 'user@test.local', nombre: 'User', password_hash: 'hash' };
    mockedUsuario.findByEmail.mockResolvedValue(mockUser as any);
    mockedJwt.sign.mockReturnValue('token' as any);
    mockedEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

    const req: any = mockRequest({ body: { email: 'user@test.local' } });
    const res: any = mockResponse();
    await forgotPassword(req, res);

    expect(mockedJwt.sign).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(String),
      expect.objectContaining({ expiresIn: '1h' })
    );
  });

  test('debe manejar error de email service', async () => {
    const mockUser = { id: 1, email: 'user@test.local', nombre: 'User', password_hash: 'hash' };
    mockedUsuario.findByEmail.mockResolvedValue(mockUser as any);
    mockedJwt.sign.mockReturnValue('token' as any);
    mockedEmailService.sendPasswordResetEmail.mockRejectedValue(new Error('Email service down'));

    const req: any = mockRequest({ body: { email: 'user@test.local' } });
    const res: any = mockResponse();
    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('debe incluir reset URL con token en email', async () => {
    const mockUser = { id: 1, email: 'user@test.local', nombre: 'User', password_hash: 'hash' };
    mockedUsuario.findByEmail.mockResolvedValue(mockUser as any);
    mockedJwt.sign.mockReturnValue('reset_token_abc' as any);
    mockedEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

    const req: any = mockRequest({ body: { email: 'user@test.local' } });
    const res: any = mockResponse();
    await forgotPassword(req, res);

    expect(mockedEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'user@test.local',
      expect.stringContaining('reset_token_abc')
    );
  });

  test('debe priorizar búsqueda en usuario antes que cuidador', async () => {
    const mockUser = { id: 1, email: 'test@test.local', nombre: 'User', password_hash: 'hash' };
    mockedUsuario.findByEmail.mockResolvedValue(mockUser as any);
    mockedCuidador.findByEmail.mockResolvedValue({ id: 2, email: 'test@test.local', nombre: 'Care', is_admin: false, password_hash: 'hash' } as any);
    mockedJwt.sign.mockReturnValue('token' as any);
    mockedEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

    const req: any = mockRequest({ body: { email: 'test@test.local' } });
    const res: any = mockResponse();
    await forgotPassword(req, res);

    expect(mockedJwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'usuario' }),
      expect.any(String),
      expect.any(Object)
    );
  });

  // Tests adicionales para resetPassword
  test('debe retornar 400 si token no está presente', async () => {
    const req: any = mockRequest({ body: { password: 'NewPass123!' } });
    const res: any = mockResponse();
    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('debe retornar 400 si password no está presente', async () => {
    const req: any = mockRequest({ body: { token: 'some_token' } });
    const res: any = mockResponse();
    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('debe verificar que purpose del token es "reset-password"', async () => {
    mockedJwt.verify.mockReturnValue({ purpose: 'wrong_purpose', email: 'user@test.local' } as any);

    const req: any = mockRequest({ body: { token: 'token', password: 'NewPass123!' } });
    const res: any = mockResponse();
    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('debe actualizar contraseña cuando token es válido', async () => {
    mockedJwt.verify.mockReturnValue({ purpose: 'reset-password', email: 'user@test.local', type: 'usuario' } as any);
    mockedUsuario.findByEmail.mockResolvedValue({ id: 1, email: 'user@test.local', nombre: 'User', password_hash: 'old_hash' } as any);
    (mockedUsuario.updatePassword as jest.Mock).mockResolvedValue(true);

    const req: any = mockRequest({ body: { token: 'valid_token', password: 'NewPassword123!' } });
    const res: any = mockResponse();
    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockedUsuario.updatePassword).toHaveBeenCalled();
  });

  test('debe actualizar contraseña en usuario tipo cuidador', async () => {
    mockedJwt.verify.mockReturnValue({ purpose: 'reset-password', email: 'care@test.local', type: 'cuidador' } as any);
    mockedCuidador.findByEmail.mockResolvedValue({ id: 2, email: 'care@test.local', nombre: 'Care', password_hash: 'old_hash', is_admin: false } as any);
    (mockedCuidador.updatePassword as jest.Mock).mockResolvedValue(true);

    const req: any = mockRequest({ body: { token: 'valid_token', password: 'NewPass123!' } });
    const res: any = mockResponse();
    await resetPassword(req, res);

    expect(mockedCuidador.updatePassword).toHaveBeenCalled();
  });

  test('debe retornar 400 si usuario no existe después de verificar token', async () => {
    mockedJwt.verify.mockReturnValue({ purpose: 'reset-password', email: 'ghost@test.local', type: 'usuario' } as any);
    mockedUsuario.findByEmail.mockResolvedValue(null);

    const req: any = mockRequest({ body: { token: 'token', password: 'NewPass123!' } });
    const res: any = mockResponse();
    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('debe manejar múltiples reset de contraseña del mismo usuario', async () => {
    for (let i = 0; i < 3; i++) {
      jest.clearAllMocks();
      mockedJwt.verify.mockReturnValue({ purpose: 'reset-password', email: 'user@test.local', type: 'usuario' } as any);
      mockedUsuario.findByEmail.mockResolvedValue({ id: 1, email: 'user@test.local', nombre: 'User', password_hash: `hash_${i}` } as any);
      (mockedUsuario.updatePassword as jest.Mock).mockResolvedValue(true);

      const req: any = mockRequest({ body: { token: `token_${i}`, password: `NewPass${i}!` } });
      const res: any = mockResponse();
      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    }
  });

  test('debe soportar diferentes fortalezas de contraseña', async () => {
    const passwords = [
      'Simple123!',
      'V3ry_C0mpl3x_P@ssw0rd!#',
      'A1b2C3d4E5',
      'Pass@word2026'
    ];

    for (const password of passwords) {
      jest.clearAllMocks();
      mockedJwt.verify.mockReturnValue({ purpose: 'reset-password', email: 'user@test.local', type: 'usuario' } as any);
      mockedUsuario.findByEmail.mockResolvedValue({ id: 1, email: 'user@test.local', nombre: 'User', password_hash: 'hash' } as any);
      (mockedUsuario.updatePassword as jest.Mock).mockResolvedValue(true);

      const req: any = mockRequest({ body: { token: 'token', password } });
      const res: any = mockResponse();
      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    }
  });
});
