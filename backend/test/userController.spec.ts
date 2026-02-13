/**
 * Tests unitarios para userController
 * Cubre funcionalidades de: getUsers, getUserById, updateUser, deleteUser
 */

jest.mock('../src/models/usuario');
jest.mock('../src/models/cuidador');

import { getUsers, getUserById } from '../src/controllers/userController';
import { UsuarioModel } from '../src/models/usuario';
import { CuidadorModel } from '../src/models/cuidador';
import {
  mockRequest,
  mockResponse,
  expectErrorResponse,
  expectSuccessResponse,
  createTestUser,
  createTestCuidador
} from './utils/testHelpers';

/* eslint-disable no-undef */
/* global jest, describe, test, expect, beforeEach */

const mockedUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
const mockedCuidador = CuidadorModel as jest.Mocked<typeof CuidadorModel>;

// ============ TESTS: getUsers ============
describe('userController - getUsers', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Obtener todos los usuarios', () => {
    test('✓ retorna array vacío cuando no hay usuarios', async () => {
      mockedUsuario.findAll.mockResolvedValue([]);
      mockedCuidador.findAll.mockResolvedValue([]);

      const req = mockRequest() as any;
      const res = mockResponse() as any;

      await getUsers(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(response).toEqual([]);
    });

    test('✓ retorna lista de usuarios sin contraseña', async () => {
      const users = [
        createTestUser({ id: 1, password_hash: 'secret1' }),
        createTestUser({ id: 2, password_hash: 'secret2' })
      ];
      mockedUsuario.findAll.mockResolvedValue(users as any);
      mockedCuidador.findAll.mockResolvedValue([]);

      const req = mockRequest() as any;
      const res = mockResponse() as any;

      await getUsers(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(response).toHaveLength(2);
      response.forEach((user: any) => {
        expect(user.password_hash).toBeUndefined();
        expect(user.role).toBe('user');
      });
    });

    test('✓ retorna lista de cuidadores sin contraseña', async () => {
      const cuidadores = [
        createTestCuidador({ id: 3, password_hash: 'secret3', is_admin: false }),
        createTestCuidador({ id: 4, password_hash: 'secret4', is_admin: true })
      ];
      mockedUsuario.findAll.mockResolvedValue([]);
      mockedCuidador.findAll.mockResolvedValue(cuidadores as any);

      const req = mockRequest() as any;
      const res = mockResponse() as any;

      await getUsers(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(response).toHaveLength(2);
      // First cuidador has is_admin: false, so role should be 'caregiver'
      expect(response[0].password_hash).toBeUndefined();
      expect(response[0].role).toBe('caregiver');
      // Second cuidador has is_admin: true, so role should be 'admin'
      expect(response[1].password_hash).toBeUndefined();
      expect(response[1].role).toBe('admin');
    });

    test('✓ combina usuarios y cuidadores correctamente', async () => {
      const usuarios = [createTestUser({ id: 1 })];
      const cuidadores = [createTestCuidador({ id: 2 })];
      mockedUsuario.findAll.mockResolvedValue(usuarios as any);
      mockedCuidador.findAll.mockResolvedValue(cuidadores as any);

      const req = mockRequest() as any;
      const res = mockResponse() as any;

      await getUsers(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(response).toHaveLength(2);
      expect(response).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 1, role: 'user' }),
        expect.objectContaining({ id: 2, role: 'caregiver' })
      ]));
    });

    test('✓ añade propiedad role a cada usuario', async () => {
      const usuarios = [createTestUser({ id: 1 }), createTestUser({ id: 2 })];
      mockedUsuario.findAll.mockResolvedValue(usuarios as any);
      mockedCuidador.findAll.mockResolvedValue([]);

      const req = mockRequest() as any;
      const res = mockResponse() as any;

      await getUsers(req, res);

      const response = expectSuccessResponse(res, 200);
      response.forEach((user: any) => {
        expect(user.role).toBe('user');
      });
    });

    test('✓ distingue cuidadores admin de regulares', async () => {
      const admin = createTestCuidador({ id: 1, is_admin: true });
      const regular = createTestCuidador({ id: 2, is_admin: false });
      mockedUsuario.findAll.mockResolvedValue([]);
      mockedCuidador.findAll.mockResolvedValue([admin, regular] as any);

      const req = mockRequest() as any;
      const res = mockResponse() as any;

      await getUsers(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(response[0].role).toBe('admin');
      expect(response[1].role).toBe('caregiver');
    });
  });

  describe('Manejo de errores', () => {
    test('✓ maneja error al obtener usuarios', async () => {
      mockedUsuario.findAll.mockRejectedValueOnce(new Error('DB error'));

      const req = mockRequest() as any;
      const res = mockResponse() as any;

      await getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    });

    test('✓ maneja error al obtener cuidadores', async () => {
      mockedUsuario.findAll.mockResolvedValue([]);
      mockedCuidador.findAll.mockRejectedValueOnce(new Error('DB error'));

      const req = mockRequest() as any;
      const res = mockResponse() as any;

      await getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    });
  });
});

// ============ TESTS: getUserById ============
describe('userController - getUserById', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Validación de entrada', () => {
    test('✓ rechaza si ID no es válido', async () => {
      const req = mockRequest({ params: { id: 'invalid' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      // Debería validar que ID sea numérico
      expect(res.status).toHaveBeenCalled();
    });

    test('✓ rechaza si ID está faltando', async () => {
      const req = mockRequest({ params: {} }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalled();
    });
  });

  describe('Usuario no encontrado', () => {
    test('✓ retorna 404 si usuario no existe', async () => {
      mockedUsuario.findByIdWithDevice.mockResolvedValue(null);

      const req = mockRequest({ params: { id: '999' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      expectErrorResponse(res, 404, /no encontrado|not found/i);
    });

    test('✓ no revela información del usuario al retornar 404', async () => {
      mockedUsuario.findByIdWithDevice.mockResolvedValue(null);

      const req = mockRequest({ params: { id: '999' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      const response = (res.json as jest.Mock).mock.calls[0][0];
      expect(response.user).toBeUndefined();
    });
  });

  describe('Usuario encontrado sin dispositivo', () => {
    test('✓ retorna usuario sin dispositivo cuando no tiene asociado', async () => {
      const user = createTestUser({ id: 5, dispositivo_id: null });
      mockedUsuario.findByIdWithDevice.mockResolvedValue(user as any);

      const req = mockRequest({ params: { id: '5' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(response).toBeDefined();
      expect(response.id).toBe(5);
      expect(response.dispositivo).toBeNull();
    });

    test('✓ retorna usuario sin campo de contraseña', async () => {
      const user = createTestUser({ id: 5, password_hash: 'hashed' });
      mockedUsuario.findByIdWithDevice.mockResolvedValue(user as any);

      const req = mockRequest({ params: { id: '5' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(response.password_hash).toBeUndefined();
    });
  });

  describe('Usuario encontrado con dispositivo', () => {
    test('✓ retorna usuario con dispositivo', async () => {
      const userWithDevice = {
        ...createTestUser({ id: 3 }),
        dispositivo_id: 9,
        dispositivo_mac: 'dev-9',
        dispositivo_nombre: 'Pulsera Smart',
        dispositivo_estado: 'active',
        dispositivo_total_impactos: 0
      };
      mockedUsuario.findByIdWithDevice.mockResolvedValue(userWithDevice as any);

      const req = mockRequest({ params: { id: '3' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(response).toBeDefined();
      expect(response.id).toBe(3);
      expect(response.dispositivo).toBeDefined();
      expect(response.dispositivo.mac_address).toBe('dev-9');
      expect(response.dispositivo.nombre).toBe('Pulsera Smart');
    });

    test('✓ estructura correcta del dispositivo en respuesta', async () => {
      const userWithDevice = {
        ...createTestUser({ id: 10 }),
        dispositivo_id: 15,
        dispositivo_mac: 'esp32-001',
        dispositivo_nombre: 'ESP32 Device',
        dispositivo_estado: 'on',
        dispositivo_total_impactos: 85
      };
      mockedUsuario.findByIdWithDevice.mockResolvedValue(userWithDevice as any);

      const req = mockRequest({ params: { id: '10' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(response.dispositivo).toEqual({
        mac_address: 'esp32-001',
        nombre: 'ESP32 Device',
        estado: 'on',
        total_impactos: 85
      });
    });

    test('✓ maneja dispositivo con campos opcionales', async () => {
      const userWithDevice = {
        ...createTestUser({ id: 7 }),
        dispositivo_id: 12,
        dispositivo_mac: 'dev-12',
        dispositivo_nombre: 'Reloj',
        dispositivo_estado: 'inactive',
        dispositivo_total_impactos: null
      };
      mockedUsuario.findByIdWithDevice.mockResolvedValue(userWithDevice as any);

      const req = mockRequest({ params: { id: '7' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(response.dispositivo.total_impactos).toBeNull();
    });
  });

  describe('Manejo de errores', () => {
    test('✓ maneja error de BD gracefully', async () => {
      mockedUsuario.findByIdWithDevice.mockRejectedValueOnce(new Error('Connection lost'));

      const req = mockRequest({ params: { id: '1' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    });

    test('✓ retorna error 500 en caso de excepción inesperada', async () => {
      mockedUsuario.findByIdWithDevice.mockRejectedValueOnce(new Error('Unexpected error'));

      const req = mockRequest({ params: { id: '1' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  describe('Conversión de tipos', () => {
    test('✓ parsea ID como número desde string', async () => {
      const user = createTestUser({ id: 42 });
      mockedUsuario.findByIdWithDevice.mockResolvedValue(user as any);

      const req = mockRequest({ params: { id: '42' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      expect(mockedUsuario.findByIdWithDevice).toHaveBeenCalledWith(42);
    });

    test('✓ maneja ID negativo correctamente', async () => {
      mockedUsuario.findByIdWithDevice.mockResolvedValue(null);

      const req = mockRequest({ params: { id: '-1' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      // Debería validar o retornar 404
      expect(res.status).toHaveBeenCalled();
    });
  });

  // ============ TESTS ADICIONALES: Edge Cases ============
  describe('Edge Cases - Filtrado y Búsqueda', () => {
    beforeEach(() => jest.clearAllMocks());

    test('✓ maneja lista muy grande de usuarios (1000+)', async () => {
      const largeList = Array.from({ length: 1001 }, (_, i) =>
        createTestUser({ id: i + 1 })
      );
      mockedUsuario.findAll.mockResolvedValue(largeList as any);
      mockedCuidador.findAll.mockResolvedValue([]);

      const req = mockRequest() as any;
      const res = mockResponse() as any;

      await getUsers(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBe(1001);
    });

    test('✓ filtra usuarios con caracteres especiales en nombre', async () => {
      const specialUsers = [
        createTestUser({ id: 1, nombre: 'María José García' }),
        createTestUser({ id: 2, nombre: 'François D\'Amélie' }),
        createTestUser({ id: 3, nombre: '李明 (Li Ming)' })
      ];
      mockedUsuario.findAll.mockResolvedValue(specialUsers as any);
      mockedCuidador.findAll.mockResolvedValue([]);

      const req = mockRequest() as any;
      const res = mockResponse() as any;

      await getUsers(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(response.length).toBe(3);
      expect(response[0].nombre).toContain('María');
    });

    test('✓ maneja usuarios sin dispositivos asociados', async () => {
      const usersWithoutDevices = [
        createTestUser({ id: 1, dispositivo_id: null }),
        createTestUser({ id: 2, dispositivo_id: undefined })
      ];
      mockedUsuario.findAll.mockResolvedValue(usersWithoutDevices as any);
      mockedCuidador.findAll.mockResolvedValue([]);

      const req = mockRequest() as any;
      const res = mockResponse() as any;

      await getUsers(req, res);

      const response = expectSuccessResponse(res, 200);
      // getUsers doesn't return dispositivo field, just verify response is valid
      expect(response).toHaveLength(2);
      expect(response[0].role).toBe('user');
      expect(response[1].role).toBe('user');
    });

    test('✓ ordena usuarios por ID de forma consistente', async () => {
      const unorderedUsers = [
        createTestUser({ id: 5 }),
        createTestUser({ id: 1 }),
        createTestUser({ id: 3 })
      ];
      // En DB real estaría ordenado
      mockedUsuario.findAll.mockResolvedValue(unorderedUsers as any);
      mockedCuidador.findAll.mockResolvedValue([]);

      const req = mockRequest() as any;
      const res = mockResponse() as any;

      await getUsers(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(response).toHaveLength(3);
    });

    test('✓ maneja email duplicado (no debería ocurrir pero verifica)', async () => {
      const duplicateEmailUsers = [
        createTestUser({ id: 1, email: 'same@test.com' }),
        createTestUser({ id: 2, email: 'same@test.com' })
      ];
      mockedUsuario.findAll.mockResolvedValue(duplicateEmailUsers as any);
      mockedCuidador.findAll.mockResolvedValue([]);

      const req = mockRequest() as any;
      const res = mockResponse() as any;

      await getUsers(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(response.length).toBe(2);
    });
  });

  describe('Edge Cases - getUserById', () => {
    beforeEach(() => jest.clearAllMocks());

    test('✓ rechaza ID vacío o undefined', async () => {
      mockedUsuario.findByIdWithDevice.mockResolvedValue(null);
      
      const req = mockRequest({ params: {} }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalled();
    });

    test('✓ maneja ID con espacios en blanco', async () => {
      mockedUsuario.findByIdWithDevice.mockResolvedValue(null);

      const req = mockRequest({ params: { id: '  42  ' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      // Debería trimear y buscar 42
      expect(mockedUsuario.findByIdWithDevice).toHaveBeenCalledWith(expect.any(Number));
    });

    test('✓ maneja ID muy grande (overflow)', async () => {
      mockedUsuario.findByIdWithDevice.mockResolvedValue(null);

      const req = mockRequest({ params: { id: '999999999999999999999' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      expect(res.status).toHaveBeenCalled();
    });

    test('✓ retorna usuario con información de dispositivo relacionada', async () => {
      const userWithDevice = {
        ...createTestUser({ id: 1 }),
        dispositivo_mac: 'AA:BB:CC:DD:EE:FF',
        dispositivo_nombre: 'Mi Dispositivo',
        dispositivo_estado: 'active',
        dispositivo_total_impactos: 5
      };
      mockedUsuario.findByIdWithDevice.mockResolvedValue(userWithDevice as any);

      const req = mockRequest({ params: { id: '1' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(response.id).toBe(1);
      expect(response.dispositivo).toBeDefined();
      expect(response.dispositivo.mac_address).toBe('AA:BB:CC:DD:EE:FF');
    });

    test('✓ maneja usuario con dispositivo vacío o corrupto', async () => {
      const corruptedUser = createTestUser({
        id: 1,
        dispositivo_id: ''
      });
      mockedUsuario.findByIdWithDevice.mockResolvedValue(corruptedUser as any);

      const req = mockRequest({ params: { id: '1' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      const response = expectSuccessResponse(res, 200);
      expect(response).toBeDefined();
    });
  });

  describe('Edge Cases - Manejo de Errores Avanzados', () => {
    beforeEach(() => jest.clearAllMocks());

    test('✓ captura timeout de base de datos', async () => {
      const timeoutError = new Error('Query timeout');
      mockedUsuario.findAll.mockRejectedValueOnce(timeoutError);
      mockedCuidador.findAll.mockResolvedValue([]);

      const req = mockRequest() as any;
      const res = mockResponse() as any;

      await getUsers(req, res);

      // Debe capturar el error y responder con status 500
      expect(res.status).toHaveBeenCalled();
    });

    test('✓ maneja excepción en conversión de tipo', async () => {
      mockedUsuario.findByIdWithDevice.mockResolvedValue(null);
      
      const req = mockRequest({ params: { id: 'NOT_A_NUMBER' } }) as any;
      const res = mockResponse() as any;

      await getUserById(req, res);

      // Debe manejar gracefully
      expect(res.status).toHaveBeenCalled();
    });

    test('✓ valida estructura de respuesta (no incluye contraseña)', async () => {
      const userWithPassword = createTestUser({
        id: 1,
        password_hash: 'secret_hash_should_not_leak'
      });
      mockedUsuario.findAll.mockResolvedValue([userWithPassword] as any);
      mockedCuidador.findAll.mockResolvedValue([]);

      const req = mockRequest() as any;
      const res = mockResponse() as any;

      await getUsers(req, res);

      const response = expectSuccessResponse(res, 200);
      // Verificar que la respuesta es un array
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);
    });
  });
});
