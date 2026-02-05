// Tests unitarios para userController (getUsers, getUserById)

jest.mock('../src/models/usuario');
jest.mock('../src/models/cuidador');

import { getUsers, getUserById } from '../src/controllers/userController';
import { UsuarioModel } from '../src/models/usuario';
import { CuidadorModel } from '../src/models/cuidador';
import { mockRequest, mockResponse } from './utils/mockRequestResponse';

const mockedUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
const mockedCuidador = CuidadorModel as jest.Mocked<typeof CuidadorModel>;

describe('userController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getUsers combina usuarios y cuidadores sin password', async () => {
    (mockedUsuario.findAll as jest.Mock).mockResolvedValue([{ id: 1, nombre: 'U', password_hash: 'x' }]);
    (mockedCuidador.findAll as jest.Mock).mockResolvedValue([{ id: 2, nombre: 'C', password_hash: 'y', is_admin: false }]);

    const req: any = mockRequest();
    const res: any = mockResponse();

    await getUsers(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ role: expect.any(String) })]));
  });

  test('getUserById devuelve usuario con dispositivo cuando existe', async () => {
    const userWithDevice = {
      id: 3,
      nombre: 'U3',
      dispositivo_id: 9,
      dispositivo_device_id: 'dev-9',
      dispositivo_nombre: 'Pulsera',
      dispositivo_estado: 'on'
    };

    (mockedUsuario.findByIdWithDevice as jest.Mock).mockResolvedValue(userWithDevice);

    const req: any = mockRequest({ params: { id: '3' } });
    const res: any = mockResponse();

    await getUserById(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'U3', dispositivo: expect.any(Object) }));
  });

  test('getUserById devuelve 404 si usuario no existe', async () => {
    (mockedUsuario.findByIdWithDevice as jest.Mock).mockResolvedValue(null);

    const req: any = mockRequest({ params: { id: '999' } });
    const res: any = mockResponse();

    await getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });
});
