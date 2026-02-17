import { receiveData, getData, getAllDevices, updateDevice } from '../src/controllers/esp32Controller';
import { ESP32Service } from '../src/services/esp32Service';
import { DispositivoModel } from '../src/models/dispositivo';
import { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

jest.mock('../src/services/esp32Service');
jest.mock('../src/models/dispositivo');
jest.mock('../src/config/redis', () => ({   // ✅ evita que ioredis se conecte en tests
  ESP32Cache: {
    setDeviceData: jest.fn(),
    getDeviceData: jest.fn(),
    addDeviceHistory: jest.fn(),
    setFallAlert: jest.fn(),
    getDeviceStatus: jest.fn(),
    setDeviceStatus: jest.fn(),
    updateHeartbeat: jest.fn(),
    getExpiredHeartbeats: jest.fn(),
    removeHeartbeat: jest.fn(),
  }
}));

const mockedESP32Service = ESP32Service as jest.Mocked<typeof ESP32Service>;
const mockedDispositivoModel = DispositivoModel as jest.Mocked<typeof DispositivoModel>;

describe('esp32Controller', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('receiveData', () => {
    test('debería retornar 200 y guardar datos exitosamente', async () => {
      const telemetry = {
        macAddress: 'AA:BB:CC:DD:EE:FF',
        temperature: 25.5,
        isFallDetected: false,
        isButtonPressed: false,
        impact_count: 2,
        impact_magnitude: 3.8
      };
      req = { body: telemetry };

      mockedESP32Service.processTelemetry.mockResolvedValue(telemetry as any);

      await receiveData(req as Request, res as Response);

      expect(mockedESP32Service.processTelemetry).toHaveBeenCalledWith(telemetry);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Data received successfully' });
    });
  });

  describe('updateDevice', () => {
    const setupUser = (role: string, id: number) => {
      req.user = { id, role };
    };

    test('debería retornar 400 si macAddress no se proporciona', async () => {
      setupUser('admin', 1);
      // ✅ macAddress va en params, no en body
      req.params = {};
      req.body = { nombre: 'New Name' };

      await updateDevice(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'MAC address is required' }));
    });

    test('debería permitir admin actualizar cualquier dispositivo', async () => {
      setupUser('admin', 1);
      // ✅ macAddress en params, nombre en body
      req.params = { macAddress: 'AA:BB:CC:DD:EE:FF' };
      req.body = { nombre: 'Updated Device' };

      mockedDispositivoModel.update.mockResolvedValue({ mac_address: 'AA:BB:CC:DD:EE:FF', nombre: 'Updated Device' } as any);

      await updateDevice(req as Request, res as Response);

      expect(mockedDispositivoModel.update).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 'Updated Device');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('debería retornar 403 si usuario no es propietario', async () => {
      setupUser('usuario', 99);
      // ✅ macAddress en params
      req.params = { macAddress: 'AA:BB:CC:DD:EE:FF' };
      req.body = { nombre: 'Hacker' };

      mockedDispositivoModel.findByMac.mockResolvedValue({ id_usuario: 5 } as any);

      await updateDevice(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});