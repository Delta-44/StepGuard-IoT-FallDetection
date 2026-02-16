// ✅ Mocks PRIMERO, antes de cualquier import
jest.mock('../src/models/usuario');
jest.mock('../src/models/cuidador');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

// ✅ Clave: los métodos del PROTOTIPO de la instancia deben ser mocks desde el inicio
const mockGetToken = jest.fn();
const mockVerifyIdToken = jest.fn();
const mockGenerateAuthUrl = jest.fn();
const mockSetCredentials = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    getToken: mockGetToken,         // ✅ referencia directa a los jest.fn() del módulo
    verifyIdToken: mockVerifyIdToken,
    generateAuthUrl: mockGenerateAuthUrl,
    setCredentials: mockSetCredentials
  }))
}));

import { googleLogin, googleAuthRedirect, googleAuthCallback } from '../src/controllers/googleAuthController';
import { UsuarioModel } from '../src/models/usuario';
import { CuidadorModel } from '../src/models/cuidador';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const mockedUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
const mockedCuidador = CuidadorModel as jest.Mocked<typeof CuidadorModel>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

const mockRequest = (overrides: any = {}) => ({
  params: {},
  body: {},
  query: {},
  user: undefined,
  ...overrides,
});

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('googleAuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockedJwt.sign as jest.Mock).mockReturnValue('mocktoken123');
    (mockedBcrypt.genSalt as jest.Mock).mockResolvedValue('salt123' as any);
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedRandomPassword123' as any);
  });

  describe('googleAuthCallback', () => {
    test('debería crear usuario si no existe y hacer callback exitoso', async () => {
      const mockPayload = {
        email: 'newgoogleuser@test.com',
        name: 'New Google User'
      };

      mockGetToken.mockResolvedValue({ tokens: { id_token: 'mockidtoken123' } });
      mockVerifyIdToken.mockResolvedValue({ getPayload: () => mockPayload });

      (mockedUsuario.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockedCuidador.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockedUsuario.create as jest.Mock).mockResolvedValue({
        id: 15,
        email: mockPayload.email,
        nombre: mockPayload.name
      });

      const req: any = mockRequest({ query: { code: 'authcode123' } });
      const res: any = mockResponse();

      await googleAuthCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('token=mocktoken123')
      );
    });

    test('debería retornar 400 si Google token payload es inválido', async () => {
      mockGetToken.mockResolvedValue({ tokens: { id_token: 'mockidtoken123' } });
      // ✅ getPayload devuelve null → el controlador hace return res.status(400)
      mockVerifyIdToken.mockResolvedValue({ getPayload: () => null });

      const req: any = mockRequest({ query: { code: 'authcode123' } });
      const res: any = mockResponse();

      await googleAuthCallback(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('googleLogin', () => {
    test('debería login exitoso si usuario existe en BD', async () => {
      const mockPayload = {
        email: 'existing@test.com',
        name: 'Existing User'
      };

      mockVerifyIdToken.mockResolvedValue({ getPayload: () => mockPayload });

      (mockedUsuario.findByEmail as jest.Mock).mockResolvedValue({
        id: 5,
        email: mockPayload.email,
        nombre: 'Existing User',
        is_admin: false,
        dispositivo_mac: 'AA:BB:CC:DD:EE:FF'
      });

      const req: any = mockRequest({ body: { token: 'validtoken' } });
      const res: any = mockResponse();

      await googleLogin(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Google login successful',
          token: 'mocktoken123'
        })
      );
    });

test('debería retornar 401 si token es inválido', async () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(); // ✅ silencia el log

  mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

  const req: any = mockRequest({ body: { token: 'invalidtoken' } });
  const res: any = mockResponse();

  await googleLogin(req, res);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'Google authentication failed' })
  );

  consoleErrorSpy.mockRestore(); // ✅ restaurar
});
  });
});