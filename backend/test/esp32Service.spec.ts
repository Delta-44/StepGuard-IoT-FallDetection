// Tests unitarios para esp32Service

jest.mock('../src/models/dispositivo');
jest.mock('../src/models/eventoCaida');
jest.mock('../src/services/alertService');

jest.mock('../src/config/redis', () => ({
  ESP32Cache: {
    setDeviceData: jest.fn().mockResolvedValue(true),
    getDeviceData: jest.fn(),
    addDeviceHistory: jest.fn().mockResolvedValue(true),
    setFallAlert: jest.fn().mockResolvedValue(true),
    getDeviceStatus: jest.fn(),
    setDeviceStatus: jest.fn().mockResolvedValue(true),
    updateHeartbeat: jest.fn().mockResolvedValue(true),
    getExpiredHeartbeats: jest.fn(),
    removeHeartbeat: jest.fn().mockResolvedValue(true),
  }
}));

import { ESP32Service } from '../src/services/esp32Service';
import { ESP32Cache } from '../src/config/redis';
import { DispositivoModel } from '../src/models/dispositivo';
import { EventoCaidaModel } from '../src/models/eventoCaida';
import { AlertService } from '../src/services/alertService';

const mockedESP32Cache = ESP32Cache as jest.Mocked<typeof ESP32Cache>;
const mockedDispositivoModel = DispositivoModel as jest.Mocked<typeof DispositivoModel>;
const mockedEventoCaidaModel = EventoCaidaModel as jest.Mocked<typeof EventoCaidaModel>;
const mockedAlertService = AlertService as jest.Mocked<typeof AlertService>;

describe('ESP32Service', () => {
beforeEach(() => {
  jest.clearAllMocks();

  // Retornan Promise<boolean>
  mockedESP32Cache.setDeviceData.mockResolvedValue(true);
  mockedESP32Cache.addDeviceHistory.mockResolvedValue(true);
  mockedESP32Cache.setFallAlert.mockResolvedValue(true);
  mockedESP32Cache.setDeviceStatus.mockResolvedValue(true);

  // Retornan Promise<void>
  mockedESP32Cache.updateHeartbeat.mockResolvedValue(undefined as unknown as void);
  mockedESP32Cache.removeHeartbeat.mockResolvedValue(undefined as unknown as void);
});

  describe('processTelemetry', () => {
    test('debería lanzar error si macAddress no se proporciona', async () => {
      const telemetry = {
        temperature: 25.5,
        impact_count: 2
      };

      await expect(ESP32Service.processTelemetry(telemetry as any)).rejects.toThrow('Mac Address is required');
    });

    test('debería guardar datos en Redis correctamente', async () => {
      const telemetry = {
        macAddress: 'AA:BB:CC:DD:EE:FF',
        temperature: 25.5,
        impact_count: 2,
        impact_magnitude: 3.8
      };

      // ✅ true en lugar de undefined
      mockedDispositivoModel.actualizarDatosESP32.mockResolvedValue({ id: 1 } as any);

      await ESP32Service.processTelemetry(telemetry);

      expect(mockedESP32Cache.setDeviceData).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', expect.any(Object));
      expect(mockedESP32Cache.addDeviceHistory).toHaveBeenCalled();
    });

    test('debería actualizar datos en PostgreSQL', async () => {
      const telemetry = {
        macAddress: 'AA:BB:CC:DD:EE:FF',
        temperature: 25.5,
        impact_count: 2,
        impact_magnitude: 3.8
      };

      // ✅ true en lugar de undefined
      mockedDispositivoModel.actualizarDatosESP32.mockResolvedValue({ id: 1 } as any);

      await ESP32Service.processTelemetry(telemetry);

      expect(mockedDispositivoModel.actualizarDatosESP32).toHaveBeenCalledWith(
        'AA:BB:CC:DD:EE:FF',
        2,
        3.8
      );
    });

    test('debería crear dispositivo si no existe', async () => {
      const telemetry = {
        macAddress: 'AA:BB:CC:DD:EE:FF',
        temperature: 25.5,
        impact_count: 2
      };

      mockedDispositivoModel.actualizarDatosESP32
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 1 } as any);
      mockedDispositivoModel.create.mockResolvedValue({ id: 1 } as any);

      await ESP32Service.processTelemetry(telemetry);

      expect(mockedDispositivoModel.create).toHaveBeenCalledWith(
        'AA:BB:CC:DD:EE:FF',
        expect.stringContaining('AA:BB:CC')
      );
    });

    test('debería detectar caída y crear evento', async () => {
      const telemetry = {
        macAddress: 'AA:BB:CC:DD:EE:FF',
        isFallDetected: true,
        impact_magnitude: 4.2,
        impact_count: 5
      };

      mockedDispositivoModel.actualizarDatosESP32.mockResolvedValue({ id: 1 } as any);
      mockedDispositivoModel.getUsuarioAsignado.mockResolvedValue({ id: 5 } as any);
      mockedEventoCaidaModel.create.mockResolvedValue({ id: 1 } as any);

      await ESP32Service.processTelemetry(telemetry);

      expect(mockedEventoCaidaModel.create).toHaveBeenCalledWith(
        'AA:BB:CC:DD:EE:FF',
        5,
        false,
        true,
        [4.2],
        5,
        'high',
        expect.any(String)
      );
    });

    test('debería broadcastar evento de caída detectada', async () => {
      const telemetry = {
        macAddress: 'AA:BB:CC:DD:EE:FF',
        isFallDetected: true,
        impact_magnitude: 4.2
      };

      mockedDispositivoModel.getUsuarioAsignado.mockResolvedValue({ id: 5 } as any);
      mockedEventoCaidaModel.create.mockResolvedValue({
        id: 1,
        dispositivo_mac: 'AA:BB:CC:DD:EE:FF'
      } as any);

      await ESP32Service.processTelemetry(telemetry);

      expect(mockedAlertService.broadcast).toHaveBeenCalled();
    });
  });

  describe('getDeviceData', () => {
    test('debería retornar datos del dispositivo desde Redis', async () => {
      const deviceData = { temperature: 25.5 };
      mockedESP32Cache.getDeviceData.mockResolvedValue(deviceData);

      const result = await ESP32Service.getDeviceData('AA:BB:CC:DD:EE:FF');

      expect(mockedESP32Cache.getDeviceData).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF');
      expect(result).toEqual(deviceData);
    });
  });

  describe('updateDeviceStatus', () => {
    test('debería marcar dispositivo como ONLINE', async () => {
      mockedESP32Cache.getDeviceStatus.mockResolvedValue(false);

      await ESP32Service.updateDeviceStatus('AA:BB:CC:DD:EE:FF', 'online');

      expect(mockedESP32Cache.setDeviceStatus).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', true);
    });

    test('debería sincronizar con PostgreSQL cuando cambia a OFFLINE', async () => {
      mockedESP32Cache.getDeviceStatus.mockResolvedValue(true);

      await ESP32Service.updateDeviceStatus('AA:BB:CC:DD:EE:FF', 'offline');

      expect(mockedDispositivoModel.updateEstado).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', false);
    });
  });

  describe('startHeartbeatMonitor', () => {
    test('debería marcar dispositivos con heartbeat expirado como OFFLINE', async () => {
      jest.useFakeTimers();

      mockedESP32Cache.getExpiredHeartbeats.mockResolvedValue(['AA:BB:CC:DD:EE:FF']);
      mockedESP32Cache.getDeviceStatus.mockResolvedValue(true);

      ESP32Service.startHeartbeatMonitor();

      await jest.advanceTimersByTimeAsync(5000);

      expect(mockedESP32Cache.getExpiredHeartbeats).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});