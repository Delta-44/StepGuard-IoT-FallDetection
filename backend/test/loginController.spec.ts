// Tests unitarios para loginController (login)

jest.mock('../src/models/usuario');
jest.mock('../src/models/cuidador');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

import { login } from '../src/controllers/loginController';
import { UsuarioModel } from '../src/models/usuario';
import { CuidadorModel } from '../src/models/cuidador';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { mockRequest, mockResponse } from './utils/mockRequestResponse';

const mockedUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
const mockedCuidador = CuidadorModel as jest.Mocked<typeof CuidadorModel>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('loginController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockedJwt.sign as jest.Mock).mockReturnValue('mocktoken123');
  });

  describe('login', () => {
    test('debería retornar 400 si email está vacío', async () => {
      const req: any = mockRequest({ body: { email: '', password: 'test123' } });
      const res: any = mockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Email and password are required' })
      );
    });

    test('debería retornar 400 si password está vacío', async () => {
      const req: any = mockRequest({ body: { email: 'user@test.com', password: '' } });
      const res: any = mockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Email and password are required' })
      );
    });

    test('debería retornar 400 si email y password están vacíos', async () => {
      const req: any = mockRequest({ body: { email: '', password: '' } });
      const res: any = mockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('debería retornar 400 "Invalid credentials" si usuario no existe', async () => {
      (mockedUsuario.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockedCuidador.findByEmail as jest.Mock).mockResolvedValue(null);

      const req: any = mockRequest({ body: { email: 'nonexistent@test.com', password: 'test123' } });
      const res: any = mockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid credentials' })
      );
    });

    test('debería retornar 400 "Invalid credentials" si contraseña es incorrecta (usuario)', async () => {
      (mockedUsuario.findByEmail as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'user@test.com',
        nombre: 'Test User',
        password_hash: 'hashedpwd',
        fecha_nacimiento: '1990-01-01',
        telefono: '123456789',
        direccion: 'Test St',
        dispositivo_mac: 'AA:BB:CC:DD:EE:FF'
      });
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      const req: any = mockRequest({ body: { email: 'user@test.com', password: 'wrongpwd' } });
      const res: any = mockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid credentials' })
      );
    });

    test('debería login exitoso para usuario (usuario role)', async () => {
      (mockedUsuario.findByEmail as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'user@test.com',
        nombre: 'Test User',
        password_hash: 'hashedpwd',
        fecha_nacimiento: '1990-01-01',
        telefono: '123456789',
        direccion: 'Test St',
        dispositivo_mac: 'AA:BB:CC:DD:EE:FF',
        foto_perfil: null,
        is_admin: false
      });
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const req: any = mockRequest({ body: { email: 'user@test.com', password: 'correctpwd' } });
      const res: any = mockResponse();

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          token: 'mocktoken123',
          user: expect.objectContaining({
            id: 1,
            email: 'user@test.com',
            fullName: 'Test User',
            role: 'user'
          })
        })
      );
    });

    test('debería login exitoso para cuidador (cuidador role)', async () => {
      (mockedUsuario.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockedCuidador.findByEmail as jest.Mock).mockResolvedValue({
        id: 5,
        email: 'caregiver@test.com',
        nombre: 'Test Caregiver',
        password_hash: 'hashedpwd',
        is_admin: false,
        fecha_nacimiento: '1985-05-05',
        telefono: '987654321',
        direccion: 'Caregiver St',
        dispositivo_mac: 'FF:EE:DD:CC:BB:AA',
        foto_perfil: null
      });
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const req: any = mockRequest({ body: { email: 'caregiver@test.com', password: 'correctpwd' } });
      const res: any = mockResponse();

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          token: 'mocktoken123',
          user: expect.objectContaining({
            id: 5,
            email: 'caregiver@test.com',
            role: 'cuidador'
          })
        })
      );
    });

    test('debería login exitoso para admin (admin role)', async () => {
      (mockedUsuario.findByEmail as jest.Mock).mockResolvedValue(null);
      (mockedCuidador.findByEmail as jest.Mock).mockResolvedValue({
        id: 10,
        email: 'admin@test.com',
        nombre: 'Admin User',
        password_hash: 'hashedpwd',
        is_admin: true,
        fecha_nacimiento: '1980-01-01',
        telefono: '111111111',
        direccion: 'Admin St',
        dispositivo_mac: 'AA:AA:AA:AA:AA:AA',
        foto_perfil: null
      });
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const req: any = mockRequest({ body: { email: 'admin@test.com', password: 'adminpwd' } });
      const res: any = mockResponse();

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          token: 'mocktoken123',
          user: expect.objectContaining({
            id: 10,
            email: 'admin@test.com',
            role: 'admin',
            is_admin: true
          })
        })
      );
    });

    test('debería retornar 500 si hay error del servidor', async () => {
      (mockedUsuario.findByEmail as jest.Mock).mockRejectedValue(
        new Error('Database connection error')
      );

      const req: any = mockRequest({ body: { email: 'user@test.com', password: 'pwd' } });
      const res: any = mockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Server error' })
      );
    });

    test('debería incluir información de perfil en la respuesta', async () => {
      (mockedUsuario.findByEmail as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'user@test.com',
        nombre: 'Test User',
        password_hash: 'hashedpwd',
        fecha_nacimiento: '1990-01-01',
        telefono: '123456789',
        direccion: 'Test St',
        dispositivo_mac: 'AA:BB:CC:DD:EE:FF',
        foto_perfil: 'profile.jpg',
        is_admin: false
      });
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const req: any = mockRequest({ body: { email: 'user@test.com', password: 'correctpwd' } });
      const res: any = mockResponse();

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            telefono: '123456789',
            direccion: 'Test St',
            dispositivo_mac: 'AA:BB:CC:DD:EE:FF',
            foto_perfil: 'profile.jpg'
          })
        })
      );
    });

    test('debería prioritizar usuario sobre cuidador si ambos existen', async () => {
      const userData = {
        id: 1,
        email: 'shared@test.com',
        nombre: 'User Version',
        password_hash: 'hashedpwd',
        fecha_nacimiento: '1990-01-01',
        telefono: '123456789',
        direccion: 'Test St',
        dispositivo_mac: 'AA:BB:CC:DD:EE:FF',
        foto_perfil: null,
        is_admin: false
      };

      (mockedUsuario.findByEmail as jest.Mock).mockResolvedValue(userData);
      (mockedCuidador.findByEmail as jest.Mock).mockResolvedValue({
        id: 2,
        email: 'shared@test.com',
        nombre: 'Caregiver Version'
      });
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const req: any = mockRequest({ body: { email: 'shared@test.com', password: 'correctpwd' } });
      const res: any = mockResponse();

      await login(req, res);

      // Should be user ID 1, not caregiver ID 2
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            id: 1,
            fullName: 'User Version',
            role: 'user'
          })
        })
      );
    });

    test('debería retornar JWT token con expiración de 1 hora', async () => {
      (mockedUsuario.findByEmail as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'user@test.com',
        nombre: 'Test User',
        password_hash: 'hashedpwd',
        fecha_nacimiento: '1990-01-01',
        telefono: '123456789',
        direccion: 'Test St',
        dispositivo_mac: 'AA:BB:CC:DD:EE:FF',
        foto_perfil: null,
        is_admin: false
      });
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const req: any = mockRequest({ body: { email: 'user@test.com', password: 'correctpwd' } });
      const res: any = mockResponse();

      await login(req, res);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          email: 'user@test.com'
        }),
        expect.any(String),
        { expiresIn: '1h' }
      );
    });
  });
});
