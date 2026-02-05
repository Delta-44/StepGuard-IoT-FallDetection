// Tests unitarios para registerController (registerUsuario, registerCuidador)

jest.mock('../src/models/usuario');
jest.mock('../src/models/cuidador');
jest.mock('jsonwebtoken');

import { registerUsuario, registerCuidador } from '../src/controllers/registerController';
import { UsuarioModel } from '../src/models/usuario';
import { CuidadorModel } from '../src/models/cuidador';
import jwt from 'jsonwebtoken';
import { mockRequest, mockResponse } from './utils/mockRequestResponse';

const mockedUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
const mockedCuidador = CuidadorModel as jest.Mocked<typeof CuidadorModel>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('registerController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockedJwt.sign as jest.Mock).mockReturnValue('mocktoken123');
  });

  test('registerUsuario valida campos necesarios', async () => {
    const req: any = mockRequest({ body: { email: '', password: '', name: '' } });
    const res: any = mockResponse();

    await registerUsuario(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('registerUsuario crea usuario cuando no existe', async () => {
    (mockedUsuario.findByEmail as jest.Mock).mockResolvedValue(null);
    (mockedUsuario.create as jest.Mock).mockResolvedValue({ id: 5, email: 'n@test', nombre: 'N' });

    const req: any = mockRequest({ body: { email: 'n@test', password: 'pwd', name: 'N' } });
    const res: any = mockResponse();

    await registerUsuario(req, res);

    expect(mockedUsuario.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
  });

  test('registerCuidador valida campos necesarios', async () => {
    const req: any = mockRequest({ body: { email: '', password: '', name: '' } });
    const res: any = mockResponse();

    await registerCuidador(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('registerCuidador crea cuidador cuando no existe', async () => {
    (mockedCuidador.findByEmail as jest.Mock).mockResolvedValue(null);
    (mockedCuidador.create as jest.Mock).mockResolvedValue({ id: 7, email: 'c@test', nombre: 'C' });

    const req: any = mockRequest({ body: { email: 'c@test', password: 'pwd', name: 'C' } });
    const res: any = mockResponse();

    await registerCuidador(req, res);

    expect(mockedCuidador.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
  });
});
