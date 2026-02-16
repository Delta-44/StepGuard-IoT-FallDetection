// Tests para eventsController - resolveEvent, getEvents, validaciones

jest.mock('../src/models/eventoCaida');
jest.mock('../src/services/alertService');

import { resolveEvent } from '../src/controllers/eventsController';
import { EventoCaidaModel } from '../src/models/eventoCaida';
import { AlertService } from '../src/services/alertService';
import { mockRequest, mockResponse } from './utils/mockRequestResponse';

const mockedEventoCaida = EventoCaidaModel as jest.Mocked<typeof EventoCaidaModel>;
const mockedAlertService = AlertService as jest.Mocked<typeof AlertService>;

describe('eventsController - resolveEvent', () => {
  beforeEach(() => jest.clearAllMocks());

  test('debe retornar 400 si event ID no es válido', async () => {
    const req: any = mockRequest({ params: { id: 'abc' }, user: { id: 1, role: 'caregiver' } });
    const res: any = mockResponse();
    await resolveEvent(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('debe retornar 400 si event ID es NaN', async () => {
    const req: any = mockRequest({ params: { id: 'NaN' }, user: { id: 1, role: 'caregiver' } });
    const res: any = mockResponse();
    await resolveEvent(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('debe retornar 401 si no hay user identificado', async () => {
    const req: any = mockRequest({ params: { id: '1' }, user: { role: 'caregiver' } });
    const res: any = mockResponse();
    await resolveEvent(req, res);
    
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('debe retornar 401 si user es null', async () => {
    const req: any = mockRequest({ params: { id: '1' } });
    const res: any = mockResponse();
    await resolveEvent(req, res);
    
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('debe resolver evento como atendida', async () => {
    const mockEvent = { id: 1, status: 'atendida', atendidoPorId: 5 };
    mockedEventoCaida.resolveWithDetails.mockResolvedValue(mockEvent as any);

    const req: any = mockRequest({
      params: { id: '1' },
      body: { status: 'atendida', notes: 'Usuario está bien', severity: 'baja' },
      user: { id: 5, role: 'caregiver' }
    });
    const res: any = mockResponse();
    await resolveEvent(req, res);

    expect(mockedEventoCaida.resolveWithDetails).toHaveBeenCalledWith(
      1, 5, 'atendida', 'Usuario está bien', 'baja'
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ event: mockEvent }));
  });

  test('debe resolver evento como falsa_alarma', async () => {
    const mockEvent = { id: 2, status: 'falsa_alarma', atendidoPorId: 5 };
    mockedEventoCaida.resolveWithDetails.mockResolvedValue(mockEvent as any);

    const req: any = mockRequest({
      params: { id: '2' },
      body: { status: 'falsa_alarma', notes: 'Falsa alarma - sensor activado por error', severity: 'nula' },
      user: { id: 5, role: 'caregiver' }
    });
    const res: any = mockResponse();
    await resolveEvent(req, res);

    expect(mockedEventoCaida.resolveWithDetails).toHaveBeenCalledWith(
      2, 5, 'falsa_alarma', 'Falsa alarma - sensor activado por error', 'nula'
    );
  });

  test('debe manejar múltiples niveles de severidad', async () => {
    const severities = ['nula', 'baja', 'media', 'alta', 'critica'];
    
    for (const severity of severities) {
      jest.clearAllMocks();
      mockedEventoCaida.resolveWithDetails.mockResolvedValue({ id: 1, status: 'atendida' } as any);

      const req: any = mockRequest({
        params: { id: '1' },
        body: { status: 'atendida', severity },
        user: { id: 5, role: 'caregiver' }
      });
      const res: any = mockResponse();
      await resolveEvent(req, res);

      expect(mockedEventoCaida.resolveWithDetails).toHaveBeenCalledWith(
        1, 5, 'atendida', undefined, severity
      );
    }
  });

  test('debe retornar 404 si evento no existe', async () => {
    mockedEventoCaida.resolveWithDetails.mockResolvedValue(null);

    const req: any = mockRequest({
      params: { id: '999' },
      body: { status: 'atendida' },
      user: { id: 5, role: 'caregiver' }
    });
    const res: any = mockResponse();
    await resolveEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('debe permitir admin resolver eventos', async () => {
    mockedEventoCaida.resolveWithDetails.mockResolvedValue({ id: 1, status: 'atendida' } as any);

    const req: any = mockRequest({
      params: { id: '1' },
      body: { status: 'atendida' },
      user: { id: 10, role: 'admin' }
    });
    const res: any = mockResponse();
    await resolveEvent(req, res);

    expect(mockedEventoCaida.resolveWithDetails).toHaveBeenCalledWith(
      1, 10, 'atendida', undefined, undefined
    );
  });

  test('debe manejar notas largas', async () => {
    mockedEventoCaida.resolveWithDetails.mockResolvedValue({ id: 1, status: 'atendida' } as any);

    const longNotes = 'a'.repeat(2000);
    const req: any = mockRequest({
      params: { id: '1' },
      body: { status: 'atendida', notes: longNotes },
      user: { id: 5, role: 'caregiver' }
    });
    const res: any = mockResponse();
    await resolveEvent(req, res);

    expect(mockedEventoCaida.resolveWithDetails).toHaveBeenCalledWith(
      1, 5, 'atendida', longNotes, undefined
    );
  });

  test('debe retornar 500 si BD falla', async () => {
    mockedEventoCaida.resolveWithDetails.mockRejectedValue(new Error('BD Connection failed'));

    const req: any = mockRequest({
      params: { id: '1' },
      body: { status: 'atendida' },
      user: { id: 5, role: 'caregiver' }
    });
    const res: any = mockResponse();
    await resolveEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('debe convertir status inválido a "atendida"', async () => {
    mockedEventoCaida.resolveWithDetails.mockResolvedValue({ id: 1, status: 'atendida' } as any);

    const req: any = mockRequest({
      params: { id: '1' },
      body: { status: 'status_invalido' },
      user: { id: 5, role: 'caregiver' }
    });
    const res: any = mockResponse();
    await resolveEvent(req, res);

    expect(mockedEventoCaida.resolveWithDetails).toHaveBeenCalledWith(
      1, 5, 'atendida', undefined, undefined
    );
  });

  test('debe manejar múltiples eventos consecutivos del mismo cuidador', async () => {
    for (let i = 1; i <= 5; i++) {
      jest.clearAllMocks();
      mockedEventoCaida.resolveWithDetails.mockResolvedValue({ id: i, status: 'atendida' } as any);

      const req: any = mockRequest({
        params: { id: `${i}` },
        body: { status: 'atendida' },
        user: { id: 5, role: 'caregiver' }
      });
      const res: any = mockResponse();
      await resolveEvent(req, res);

      expect(res.json).toHaveBeenCalled();
    }
  });

  test('debe incluir información del usuario en el evento resuelto', async () => {
    const mockEvent = {
      id: 1,
      status: 'atendida',
      atendidoPorId: 5,
      atendidoPorNombre: 'Cuidador Name',
      timestamp: '2026-02-13T10:00:00Z'
    };
    mockedEventoCaida.resolveWithDetails.mockResolvedValue(mockEvent as any);

    const req: any = mockRequest({
      params: { id: '1' },
      body: { status: 'atendida' },
      user: { id: 5, role: 'caregiver', nombre: 'Cuidador Name' }
    });
    const res: any = mockResponse();
    await resolveEvent(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ event: mockEvent }));
  });
});
