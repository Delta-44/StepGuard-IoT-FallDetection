/**
 * Utilidades avanzadas para mocks de Express Request/Response
 * Proporciona mocks más completos y reutilizables para tests
 */

import { Request, Response } from 'express';

/**
 * Factory mejorada para crear mocks de Request
 */
export function mockRequest(data: Partial<{
  body: Record<string, any>;
  params: Record<string, any>;
  query: Record<string, any>;
  headers: Record<string, any>;
  user: any;
  method: string;
  url: string;
  path: string;
}> = {}): Partial<Request> {
  return {
    body: data.body || {},
    params: data.params || {},
    query: data.query || {},
    headers: data.headers || {},
    user: data.user || undefined,
    method: data.method || 'GET',
    url: data.url || '/',
    path: data.path || '/',
  } as any;
}

/**
 * Factory mejorada para crear mocks de Response
 * Incluye métodos comúnmente utilizados
 */
export function mockResponse(): Partial<Response> {
  const res: any = {};

  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);

  // Helpers para assertions más fáciles
  res.getStatusCode = () => (res.status as jest.Mock).mock.calls[0]?.[0];
  res.getJsonData = () => (res.json as jest.Mock).mock.calls[0]?.[0];
  res.getSentData = () => (res.send as jest.Mock).mock.calls[0]?.[0];

  return res as any;
}

/**
 * Fixture de usuario para tests
 */
export const testUserFixture = {
  id: 1,
  nombre: 'Test Usuario',
  email: 'test@example.com',
  password_hash: 'hashed_password',
  edad: 65,
  genero: 'M',
  created_at: new Date('2023-01-01'),
  updated_at: new Date('2023-01-01'),
};

/**
 * Fixture de cuidador para tests
 */
export const testCuidadorFixture = {
  id: 2,
  nombre: 'Test Cuidador',
  email: 'cuidador@example.com',
  password_hash: 'hashed_password',
  telefono: '123456789',
  is_admin: false,
  created_at: new Date('2023-01-01'),
  updated_at: new Date('2023-01-01'),
};

/**
 * Factory para crear usuarios con datos custom
 */
export function createTestUser(overrides?: Partial<typeof testUserFixture> & Record<string, any>) {
  return { ...testUserFixture, ...overrides };
}

/**
 * Factory para crear cuidadores con datos custom
 */
export function createTestCuidador(overrides?: Partial<typeof testCuidadorFixture> & Record<string, any>) {
  return { ...testCuidadorFixture, ...overrides };
}

/**
 * Helper para verificar respuesta de error
 */
export function expectErrorResponse(res: any, expectedStatus: number, expectedMessage?: string | RegExp) {
  expect(res.status).toHaveBeenCalledWith(expectedStatus);
  const jsonCall = (res.json as jest.Mock).mock.calls[0]?.[0];
  expect(jsonCall).toBeDefined();
  expect(jsonCall.message).toBeDefined();

  if (expectedMessage) {
    if (typeof expectedMessage === 'string') {
      expect(jsonCall.message).toBe(expectedMessage);
    } else {
      expect(jsonCall.message).toMatch(expectedMessage);
    }
  }
}

/**
 * Helper para verificar respuesta exitosa
 */
export function expectSuccessResponse(res: any, expectedStatus: number = 200) {
  // Si res.status fue llamado, verificar el código
  if ((res.status as jest.Mock).mock.calls.length > 0) {
    expect(res.status).toHaveBeenCalledWith(expectedStatus);
  }
  // De todos modos, obtener el JSON que fue enviado
  const jsonCall = (res.json as jest.Mock).mock.calls[0]?.[0];
  expect(jsonCall).toBeDefined();
  return jsonCall;
}
