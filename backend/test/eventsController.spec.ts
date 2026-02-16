jest.mock('../src/models/eventoCaida');
jest.mock('../src/services/alertService');

import { resolveEvent, getEvents } from '../src/controllers/eventsController';
import { EventoCaidaModel } from '../src/models/eventoCaida';
import { AlertService } from '../src/services/alertService';

const mockedEventoCaidaModel = EventoCaidaModel as jest.Mocked<typeof EventoCaidaModel>;
const mockedAlertService = AlertService as jest.Mocked<typeof AlertService>;

// ✅ mockRequest/mockResponse inline para tener control total
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
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('eventsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveEvent', () => {
    test('debería retornar 400 si event ID es inválido', async () => {
      const req: any = mockRequest({
        params: { id: 'invalid_id' },
        user: { id: 1, role: 'cuidador' },
        body: { status: 'atendida', notes: 'Handled' }
      });
      const res: any = mockResponse();

      await resolveEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid event ID' })
      );
    });

    test('debería retornar 401 si usuario no está autenticado', async () => {
      const req: any = mockRequest({
        params: { id: '1' },
        user: undefined,
        body: { status: 'atendida', notes: 'Handled' }
      });
      const res: any = mockResponse();

      await resolveEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'User not identified' })
      );
    });

test('debería resolver evento como "atendida" exitosamente', async () => {
  const updatedEvent = {
    id: 1,
    dispositivo_mac: 'AA:BB:CC:DD:EE:FF',
    atendido_por: 5,
    atendido_por_nombre: 'Caregiver Name',
    status: 'atendida',
    notes: 'Handled correctly'
  };

  (mockedEventoCaidaModel.resolveWithDetails as jest.Mock).mockResolvedValue(updatedEvent);
  (mockedEventoCaidaModel.findById as jest.Mock).mockResolvedValue(updatedEvent); // ✅ añadir
  (mockedAlertService.broadcast as jest.Mock).mockImplementation(() => {});

  const req: any = mockRequest({
    params: { id: '1' },
    user: { id: 5, role: 'cuidador' },
    body: { status: 'atendida', notes: 'Handled correctly', severity: 'high' }
  });
  const res: any = mockResponse();

  await resolveEvent(req, res);

  expect(mockedEventoCaidaModel.resolveWithDetails).toHaveBeenCalledWith(
    1, 5, 'atendida', 'Handled correctly', 'high'
  );
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      message: 'Event mark as resolved',
      event: expect.objectContaining({ status: 'atendida' })
    })
  );
});

    test('debería retornar 404 si evento no existe', async () => {
      (mockedEventoCaidaModel.resolveWithDetails as jest.Mock).mockResolvedValue(null);

      const req: any = mockRequest({
        params: { id: '999' },
        user: { id: 5, role: 'cuidador' },
        body: { status: 'atendida', notes: 'Handled' }
      });
      const res: any = mockResponse();

      await resolveEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Event not found' })
      );
    });

test('debería broadcastar evento resuelto a SSE clients', async () => {
  const updatedEvent = {
    id: 1,
    dispositivo_mac: 'AA:BB:CC:DD:EE:FF',
    atendido_por: 5,
    atendido_por_nombre: 'Caregiver Name',
    status: 'atendida'
  };

  (mockedEventoCaidaModel.resolveWithDetails as jest.Mock).mockResolvedValue(updatedEvent);
  (mockedEventoCaidaModel.findById as jest.Mock).mockResolvedValue(updatedEvent); // ✅ añadir
  (mockedAlertService.broadcast as jest.Mock).mockImplementation(() => {});

  const req: any = mockRequest({
    params: { id: '1' },
    user: { id: 5, role: 'cuidador' },
    body: { status: 'atendida', notes: 'Handled' }
  });
  const res: any = mockResponse();

  await resolveEvent(req, res);

  // ✅ El broadcast ahora recibe populatedEvent (el resultado de findById)
  expect(mockedAlertService.broadcast).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'EVENT_RESOLVED',
      data: updatedEvent
    })
  );
});
  });

  describe('getEvents', () => {
    test('debería retornar eventos pendientes por defecto', async () => {
      const pendingEvents = [
        { id: 1, status: 'pendiente', dispositivo_mac: 'AA:BB:CC:DD:EE:FF' },
        { id: 2, status: 'pendiente', dispositivo_mac: 'FF:EE:DD:CC:BB:AA' }
      ];

      (mockedEventoCaidaModel.findPendientes as jest.Mock).mockResolvedValue(pendingEvents);

      const req: any = mockRequest({ query: {} });
      const res: any = mockResponse();

      await getEvents(req, res);

      expect(mockedEventoCaidaModel.findPendientes).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(pendingEvents);
    });

    test('debería retornar eventos filtrados por deviceId', async () => {
      const deviceEvents = [
        { id: 1, status: 'pendiente', dispositivo_mac: 'AA:BB:CC:DD:EE:FF' }
      ];

      (mockedEventoCaidaModel.findByDispositivo as jest.Mock).mockResolvedValue(deviceEvents);

      const req: any = mockRequest({ query: { deviceId: 'AA:BB:CC:DD:EE:FF', limit: '50' } });
      const res: any = mockResponse();

      await getEvents(req, res);

      expect(mockedEventoCaidaModel.findByDispositivo).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 50);
      expect(res.json).toHaveBeenCalledWith(deviceEvents);
    });

    test('debería retornar eventos filtrados por userId', async () => {
      const userEvents = [
        { id: 1, status: 'pendiente', dispositivo_mac: 'AA:BB:CC:DD:EE:FF', userAsignado: 5 }
      ];

      (mockedEventoCaidaModel.findByUsuario as jest.Mock).mockResolvedValue(userEvents);

      const req: any = mockRequest({ query: { userId: '5', limit: '50' } });
      const res: any = mockResponse();

      await getEvents(req, res);

      expect(mockedEventoCaidaModel.findByUsuario).toHaveBeenCalledWith(5, 50);
      expect(res.json).toHaveBeenCalledWith(userEvents);
    });

    test('debería retornar eventos filtrados por rango de fechas', async () => {
      const dateRangeEvents = [{ id: 1, status: 'atendida', fecha: '2026-02-08' }];

      (mockedEventoCaidaModel.findByFechas as jest.Mock).mockResolvedValue(dateRangeEvents);

      const req: any = mockRequest({
        query: { startDate: '2026-02-01', endDate: '2026-02-09' }
      });
      const res: any = mockResponse();

      await getEvents(req, res);

      expect(mockedEventoCaidaModel.findByFechas).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
      expect(res.json).toHaveBeenCalledWith(dateRangeEvents);
    });

    test('debería usar limit por defecto de 50 si no se proporciona', async () => {
      const deviceEvents: any[] = [];

      (mockedEventoCaidaModel.findByDispositivo as jest.Mock).mockResolvedValue(deviceEvents);

      const req: any = mockRequest({ query: { deviceId: 'AA:BB:CC:DD:EE:FF' } });
      const res: any = mockResponse();

      await getEvents(req, res);

      expect(mockedEventoCaidaModel.findByDispositivo).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 50);
    });

    test('debería priorizar deviceId sobre userId si ambos están presentes', async () => {
      const deviceEvents = [{ id: 1, dispositivo_mac: 'AA:BB:CC:DD:EE:FF' }];

      (mockedEventoCaidaModel.findByDispositivo as jest.Mock).mockResolvedValue(deviceEvents);

      const req: any = mockRequest({
        query: { deviceId: 'AA:BB:CC:DD:EE:FF', userId: '5' }
      });
      const res: any = mockResponse();

      await getEvents(req, res);

      expect(mockedEventoCaidaModel.findByDispositivo).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 50);
      expect(mockedEventoCaidaModel.findByUsuario).not.toHaveBeenCalled();
    });

test('debería retornar 500 si hay error del servidor', async () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(); // ✅ silencia el log

  (mockedEventoCaidaModel.findPendientes as jest.Mock).mockRejectedValue(
    new Error('Database error')
  );

  const req: any = mockRequest({ query: {} });
  const res: any = mockResponse();

  await getEvents(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'Error fetching events' })
  );

  consoleErrorSpy.mockRestore(); // ✅ restaurar para no afectar otros tests
});
  });
});
