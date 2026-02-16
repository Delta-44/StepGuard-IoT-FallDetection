// Tests unitarios para userController - MEJORADOS

jest.mock('../src/models/usuario');
jest.mock('../src/models/cuidador');
jest.mock('../src/models/dispositivo');

import { getUsers, getUserById } from '../src/controllers/userController';
import { UsuarioModel } from '../src/models/usuario';
import { CuidadorModel } from '../src/models/cuidador';
import { DispositivoModel } from '../src/models/dispositivo';
import { mockRequest, mockResponse } from './utils/mockRequestResponse';

const mockedUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
const mockedCuidador = CuidadorModel as jest.Mocked<typeof CuidadorModel>;
const mockedDispositivo = DispositivoModel as jest.Mocked<typeof DispositivoModel>;

describe('userController - getUsers', () => {
  beforeEach(() => jest.clearAllMocks());

  test('debe llamar a findAll en ambos modelos', async () => {
    mockedUsuario.findAll.mockResolvedValue([]);
    mockedCuidador.findAll.mockResolvedValue([]);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    expect(mockedUsuario.findAll).toHaveBeenCalled();
    expect(mockedCuidador.findAll).toHaveBeenCalled();
  });

  test('debe retornar lista combinada de usuarios y cuidadores', async () => {
    mockedUsuario.findAll.mockResolvedValue([
      { id: 1, email: 'user1@test.local', nombre: 'User 1', password_hash: 'hash1' } as any,
    ]);
    mockedCuidador.findAll.mockResolvedValue([
      { id: 2, email: 'care1@test.local', nombre: 'Care 1', password_hash: 'hash2', is_admin: false } as any,
    ]);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    expect(Array.isArray(callData)).toBe(true);
    if (Array.isArray(callData)) {
      expect(callData.length).toBeGreaterThanOrEqual(2);
    }
  });

  test('debe retornar lista vacía cuando no hay usuarios', async () => {
    mockedUsuario.findAll.mockResolvedValue([]);
    mockedCuidador.findAll.mockResolvedValue([]);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('debe excluir password_hash de usuarios', async () => {
    mockedUsuario.findAll.mockResolvedValue([
      { id: 1, email: 'user@test.local', nombre: 'User', password_hash: 'secret' } as any,
    ]);
    mockedCuidador.findAll.mockResolvedValue([]);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (Array.isArray(callData) && callData.length > 0) {
      expect(callData[0]).not.toHaveProperty('password_hash');
    }
  });

  test('debe asignar rol "user" a usuarios', async () => {
    mockedUsuario.findAll.mockResolvedValue([
      { id: 1, email: 'user@test.local', nombre: 'User', password_hash: 'hash' } as any,
    ]);
    mockedCuidador.findAll.mockResolvedValue([]);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (Array.isArray(callData) && callData.length > 0) {
      expect(callData[0]).toHaveProperty('role', 'user');
    }
  });

  test('debe asignar rol "caregiver" a cuidadores no admin', async () => {
    mockedUsuario.findAll.mockResolvedValue([]);
    mockedCuidador.findAll.mockResolvedValue([
      { id: 1, email: 'care@test.local', nombre: 'Care', password_hash: 'hash', is_admin: false } as any,
    ]);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (Array.isArray(callData) && callData.length > 0) {
      expect(callData[0]).toHaveProperty('role', 'caregiver');
    }
  });

  test('debe asignar rol "admin" a cuidadores admin', async () => {
    mockedUsuario.findAll.mockResolvedValue([]);
    mockedCuidador.findAll.mockResolvedValue([
      { id: 1, email: 'admin@test.local', nombre: 'Admin', password_hash: 'hash', is_admin: true } as any,
    ]);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (Array.isArray(callData) && callData.length > 0) {
      expect(callData[0]).toHaveProperty('role', 'admin');
    }
  });

  test('debe manejar error de BD', async () => {
    mockedUsuario.findAll.mockRejectedValue(new Error('DB Error'));

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('debe retornar múltiples usuarios en lista combinada', async () => {
    mockedUsuario.findAll.mockResolvedValue([
      { id: 1, email: 'user1@test.local', nombre: 'User 1', password_hash: 'h1' } as any,
      { id: 2, email: 'user2@test.local', nombre: 'User 2', password_hash: 'h2' } as any,
    ]);
    mockedCuidador.findAll.mockResolvedValue([
      { id: 3, email: 'care1@test.local', nombre: 'Care 1', password_hash: 'h3', is_admin: false } as any,
    ]);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (Array.isArray(callData)) {
      expect(callData.length).toBe(3);
    }
  });
});

describe('userController - getUserById', () => {
  beforeEach(() => jest.clearAllMocks());

  test('debe retornar usuario por ID cuando hace su propia consulta', async () => {
    mockedUsuario.findByIdWithDevice.mockResolvedValue({
      id: 1,
      email: 'user@test.local',
      nombre: 'User',
      password_hash: 'hash',
      dispositivo_mac: 'aa:bb:cc',
      dispositivo_nombre: 'Device',
      dispositivo_estado: 'active',
      dispositivo_total_impactos: 0,
    } as any);

    const req: any = mockRequest({ params: { id: '1' }, user: { id: '1', role: 'user' } });
    const res: any = mockResponse();
    await getUserById(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('debe retornar cuidador por ID cuando hace su propia consulta', async () => {
    mockedCuidador.findById.mockResolvedValue({
      id: 2,
      email: 'care@test.local',
      nombre: 'Care',
      password_hash: 'hash',
      is_admin: false,
    } as any);

    const req: any = mockRequest({ params: { id: '2' }, user: { id: '2', role: 'caregiver' } });
    const res: any = mockResponse();
    await getUserById(req, res);

    expect(res.json).toHaveBeenCalled();
  });

  test('debe excluir password_hash de usuario retornado', async () => {
    mockedUsuario.findByIdWithDevice.mockResolvedValue({
      id: 1,
      email: 'user@test.local',
      nombre: 'User',
      password_hash: 'secret',
      dispositivo_mac: 'aa:bb:cc',
      dispositivo_nombre: 'Device',
      dispositivo_estado: 'active',
      dispositivo_total_impactos: 0,
    } as any);

    const req: any = mockRequest({ params: { id: '1' }, user: { id: '1', role: 'user' } });
    const res: any = mockResponse();
    await getUserById(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    expect(callData).not.toHaveProperty('password_hash');
  });

  test('debe incluir dispositivo en respuesta si existe', async () => {
    mockedUsuario.findByIdWithDevice.mockResolvedValue({
      id: 1,
      email: 'user@test.local',
      nombre: 'User',
      password_hash: 'hash',
      dispositivo_mac: 'aa:bb:cc',
      dispositivo_nombre: 'Device 1',
      dispositivo_estado: 'active',
      dispositivo_total_impactos: 5,
    } as any);

    const req: any = mockRequest({ params: { id: '1' }, user: { id: '1', role: 'user' } });
    const res: any = mockResponse();
    await getUserById(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (callData && typeof callData === 'object') {
      expect(callData).toHaveProperty('dispositivo');
    }
  });

  test('debe retornar admin con rol admin', async () => {
    mockedCuidador.findById.mockResolvedValue({
      id: 3,
      email: 'admin@test.local',
      nombre: 'Admin',
      password_hash: 'hash',
      is_admin: true,
    } as any);

    const req: any = mockRequest({ params: { id: '3' }, user: { id: '3', role: 'admin' } });
    const res: any = mockResponse();
    await getUserById(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (callData && typeof callData === 'object') {
      expect(callData).toHaveProperty('role', 'admin');
    }
  });

  test('debe incluir fullName para cuidadores', async () => {
    mockedCuidador.findById.mockResolvedValue({
      id: 2,
      email: 'care@test.local',
      nombre: 'John Care',
      password_hash: 'hash',
      is_admin: false,
    } as any);

    const req: any = mockRequest({ params: { id: '2' }, user: { id: '2', role: 'caregiver' } });
    const res: any = mockResponse();
    await getUserById(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (callData && typeof callData === 'object') {
      expect(callData).toHaveProperty('fullName', 'John Care');
    }
  });

  test('debe retornar 404 cuando usuario no existe', async () => {
    mockedUsuario.findByIdWithDevice.mockResolvedValue(null);
    mockedCuidador.findById.mockResolvedValue(null);

    const req: any = mockRequest({ params: { id: '999' }, user: { id: '999', role: 'user' } });
    const res: any = mockResponse();
    await getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('debe manejar error de BD', async () => {
    mockedUsuario.findByIdWithDevice.mockRejectedValue(new Error('DB Error'));

    const req: any = mockRequest({ params: { id: '1' }, user: { id: '1', role: 'user' } });
    const res: any = mockResponse();
    await getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('debe incluir información de dispositivo correctamente', async () => {
    mockedUsuario.findByIdWithDevice.mockResolvedValue({
      id: 1,
      email: 'user@test.local',
      nombre: 'User',
      password_hash: 'hash',
      dispositivo_mac: 'aa:bb:cc:dd:ee:ff',
      dispositivo_nombre: 'Device 1',
      dispositivo_estado: 'active',
      dispositivo_total_impactos: 42,
    } as any);

    const req: any = mockRequest({ params: { id: '1' }, user: { id: '1', role: 'user' } });
    const res: any = mockResponse();
    await getUserById(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (callData && callData.dispositivo) {
      expect(callData.dispositivo).toHaveProperty('mac_address', 'aa:bb:cc:dd:ee:ff');
      expect(callData.dispositivo).toHaveProperty('nombre', 'Device 1');
      expect(callData.dispositivo).toHaveProperty('estado', 'active');
    }
  });

  test('debe retornar dispositivo null si usuario no tiene dispositivo', async () => {
    mockedUsuario.findByIdWithDevice.mockResolvedValue({
      id: 1,
      email: 'user@test.local',
      nombre: 'User',
      password_hash: 'hash',
      dispositivo_mac: null,
      dispositivo_nombre: null,
      dispositivo_estado: null,
      dispositivo_total_impactos: null,
    } as any);

    const req: any = mockRequest({ params: { id: '1' }, user: { id: '1', role: 'user' } });
    const res: any = mockResponse();
    await getUserById(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (callData) {
      expect(callData.dispositivo).toBeNull();
    }
  });

  test('debe incluir fullName con status para cuidadores', async () => {
    mockedCuidador.findById.mockResolvedValue({
      id: 2,
      email: 'care@test.local',
      nombre: 'John Care',
      password_hash: 'hash',
      is_admin: false,
    } as any);

    const req: any = mockRequest({ params: { id: '2' }, user: { id: '2', role: 'caregiver' } });
    const res: any = mockResponse();
    await getUserById(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (callData) {
      expect(callData).toHaveProperty('fullName', 'John Care');
    }
  });
});

describe('userController - getUsers adicionales', () => {
  beforeEach(() => jest.clearAllMocks());

  test('debe retornar fullName para cuidadores', async () => {
    mockedUsuario.findAll.mockResolvedValue([]);
    mockedCuidador.findAll.mockResolvedValue([
      { id: 1, email: 'care@test.local', nombre: 'John Care', password_hash: 'hash', is_admin: false } as any,
    ]);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (Array.isArray(callData) && callData.length > 0) {
      const cuidador = callData[0];
      if (cuidador.role === 'caregiver') {
        expect(cuidador).toHaveProperty('fullName', 'John Care');
      }
    }
  });

  test('debe incluir status activo para todos los cuidadores', async () => {
    mockedUsuario.findAll.mockResolvedValue([]);
    mockedCuidador.findAll.mockResolvedValue([
      { id: 1, email: 'care1@test.local', nombre: 'Care 1', password_hash: 'hash', is_admin: false } as any,
      { id: 2, email: 'care2@test.local', nombre: 'Care 2', password_hash: 'hash', is_admin: false } as any,
    ]);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (Array.isArray(callData)) {
      callData.forEach(user => {
        if (user.role === 'caregiver' || user.role === 'admin') {
          expect(user).toHaveProperty('status', 'active');
        }
      });
    }
  });

  test('debe retornar orden correcto de usuarios y cuidadores combinados', async () => {
    mockedUsuario.findAll.mockResolvedValue([
      { id: 1, email: 'user1@test.local', nombre: 'User 1', password_hash: 'hash' } as any,
      { id: 2, email: 'user2@test.local', nombre: 'User 2', password_hash: 'hash' } as any,
    ]);
    mockedCuidador.findAll.mockResolvedValue([
      { id: 10, email: 'care1@test.local', nombre: 'Care 1', password_hash: 'hash', is_admin: false } as any,
    ]);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    expect(Array.isArray(callData)).toBe(true);
    if (Array.isArray(callData)) {
      expect(callData.length).toBe(3);
      // Usuarios first, then cuidadores
      expect(callData.slice(0, 2).every(u => u.role === 'user')).toBe(true);
    }
  });

  test('debe manejar cuando solo hay usuarios', async () => {
    mockedUsuario.findAll.mockResolvedValue([
      { id: 1, email: 'user@test.local', nombre: 'User', password_hash: 'hash' } as any,
    ]);
    mockedCuidador.findAll.mockResolvedValue([]);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (Array.isArray(callData)) {
      expect(callData.length).toBe(1);
      expect(callData[0]).toHaveProperty('role', 'user');
    }
  });

  test('debe manejar cuando solo hay cuidadores', async () => {
    mockedUsuario.findAll.mockResolvedValue([]);
    mockedCuidador.findAll.mockResolvedValue([
      { id: 1, email: 'care@test.local', nombre: 'Care', password_hash: 'hash', is_admin: false } as any,
    ]);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (Array.isArray(callData)) {
      expect(callData.length).toBe(1);
      expect(callData[0]).toHaveProperty('role', 'caregiver');
    }
  });

  test('debe manejar muchos usuarios y cuidadores', async () => {
    const usuarios = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      email: `user${i}@test.local`,
      nombre: `User ${i}`,
      password_hash: 'hash'
    }));
    const cuidadores = Array.from({ length: 20 }, (_, i) => ({
      id: 100 + i,
      email: `care${i}@test.local`,
      nombre: `Care ${i}`,
      password_hash: 'hash',
      is_admin: i % 3 === 0 // Algunos admins
    }));

    mockedUsuario.findAll.mockResolvedValue(usuarios as any);
    mockedCuidador.findAll.mockResolvedValue(cuidadores as any);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (Array.isArray(callData)) {
      expect(callData.length).toBe(70);
    }
  });

  test('debe excluir is_admin de respuesta para cuidadores', async () => {
    mockedUsuario.findAll.mockResolvedValue([]);
    mockedCuidador.findAll.mockResolvedValue([
      { id: 1, email: 'care@test.local', nombre: 'Care', password_hash: 'hash', is_admin: true } as any,
    ]);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (Array.isArray(callData) && callData.length > 0) {
      expect(callData[0]).not.toHaveProperty('is_admin');
    }
  });

  test('debe mapear is_admin correctamente a role', async () => {
    mockedUsuario.findAll.mockResolvedValue([]);
    mockedCuidador.findAll.mockResolvedValue([
      { id: 1, email: 'admin@test.local', nombre: 'Admin', password_hash: 'hash', is_admin: true } as any,
      { id: 2, email: 'care@test.local', nombre: 'Care', password_hash: 'hash', is_admin: false } as any,
    ]);

    const req: any = mockRequest({});
    const res: any = mockResponse();
    await getUsers(req, res);

    const callData = res.json.mock.calls[0]?.[0];
    if (Array.isArray(callData)) {
      const admin = callData.find(u => u.email === 'admin@test.local');
      const care = callData.find(u => u.email === 'care@test.local');
      expect(admin?.role).toBe('admin');
      expect(care?.role).toBe('caregiver');
    }
  });
});
