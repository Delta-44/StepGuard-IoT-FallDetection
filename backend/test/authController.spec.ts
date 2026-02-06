// Tests unitarios para authController (forgotPassword, resetPassword)

import { forgotPassword, resetPassword } from '../src/controllers/authController';
import { UsuarioModel } from '../src/models/usuario';
import { CuidadorModel } from '../src/models/cuidador';
import jwt from 'jsonwebtoken';
import { mockRequest, mockResponse } from './utils/mockRequestResponse';

/* eslint-disable no-undef */
/* global jest, describe, test, expect, beforeEach */

// Mocks
jest.mock('../src/models/usuario');
jest.mock('../src/models/cuidador');
jest.mock('jsonwebtoken');
jest.mock('../src/services/emailService', () => ({
  __esModule: true,
  default: { sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined) }
}));

const mockedUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
const mockedCuidador = CuidadorModel as jest.Mocked<typeof CuidadorModel>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('authController - forgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockedJwt.sign as jest.Mock).mockReturnValue('mocktoken123');
    process.env.CORS_ORIGIN = 'http://localhost:4200';
  });

  test('debe responder 400 si falta email', async () => {
    const req = mockRequest({ body: {} }) as any;
    const res = mockResponse() as any;

    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  test('si email no existe responde 200 y no lanza error', async () => {
    mockedUsuario.findByEmail.mockResolvedValue(null);
    mockedCuidador.findByEmail.mockResolvedValue(null);

    const req = mockRequest({ body: { email: 'noexiste@test.local' } }) as any;
    const res = mockResponse() as any;

    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  test('si usuario existe envía email de reset', async () => {
    mockedUsuario.findByEmail.mockResolvedValue({ id: 1, email: 'ok@test.local' } as any);

    const req = mockRequest({ body: { email: 'ok@test.local' } }) as any;
    const res = mockResponse() as any;

    await forgotPassword(req, res);

    expect(mockedJwt.sign).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('authController - resetPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  test('debe responder 400 si faltan token o password', async () => {
    const req = mockRequest({ body: { password: 'abc' } }) as any;
    const res = mockResponse() as any;

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('debe rechazar token inválido', async () => {
    mockedJwt.verify.mockImplementation(() => { throw new Error('invalid'); });

    const req = mockRequest({ body: { token: 'bad', password: 'pwd' } }) as any;
    const res = mockResponse() as any;

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('reseteo exitoso actualiza contraseña', async () => {
    const decoded = { email: 'u@test', type: 'usuario', purpose: 'reset-password', iat: Math.floor(Date.now() / 1000) };
    mockedJwt.verify.mockReturnValue(decoded as any);
    mockedUsuario.findByEmail.mockResolvedValue({ id: 10, email: 'u@test', password_last_changed_at: null } as any);
    mockedUsuario.updatePassword.mockResolvedValue({ id: 10 } as any);

    const req = mockRequest({ body: { token: 'good', password: 'newpass123' } }) as any;
    const res = mockResponse() as any;

    await resetPassword(req, res);

    expect(mockedUsuario.updatePassword).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});