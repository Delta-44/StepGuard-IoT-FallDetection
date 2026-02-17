// Tests unitarios para alertService corregidos

jest.mock('../src/models/usuario');
jest.mock('../src/services/discordService');

import { AlertService } from '../src/services/alertService';
import { UsuarioModel } from '../src/models/usuario';
import { DiscordService } from '../src/services/discordService';
import { Response } from 'express';

describe('AlertService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Resetear el array de clientes antes de cada test
    (AlertService as any).clients = [];
  });

  describe('addClient', () => {
    test('debería agregar un cliente SSE correctamente', () => {
      const mockRes: Partial<Response> = {
        setHeader: jest.fn(),
        write: jest.fn(),
        on: jest.fn().mockReturnThis()
      };

      AlertService.addClient(mockRes as Response, 1, 'usuario');

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('Connected to Targeted Alert Stream'));
    });

    test('debería registrar desconexión del cliente cuando se cierra', () => {
      const closeCallbacks: Array<Function> = [];

      const mockRes: Partial<Response> = {
        setHeader: jest.fn(),
        write: jest.fn(),
        on: jest.fn().mockImplementation(function (this: any, event: string, fn: Function) {
          if (event === 'close') {
            closeCallbacks.push(fn);
          }
          return this; 
        })
      };

      AlertService.addClient(mockRes as Response, 1, 'usuario');

      // Simular cierre de cliente
      closeCallbacks.forEach(cb => cb());

      // El cliente debe ser removido de la lista
      expect((AlertService as any).clients.length).toBe(0);
    });
  });

  describe('broadcast', () => {
    test('debería enviar alerta solo al propietario del dispositivo', async () => {
      const mockRes: Partial<Response> = {
        setHeader: jest.fn(),
        write: jest.fn(),
        on: jest.fn().mockReturnThis()
      };

      AlertService.addClient(mockRes as Response, 5, 'usuario');
      
      // Limpiar el write del mensaje de bienvenida
      jest.spyOn(mockRes, 'write').mockClear();

      const mockUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
      (mockUsuario.findByDispositivo as jest.Mock).mockResolvedValue({ id: 5 });
      (mockUsuario.getCuidadoresAsignados as jest.Mock).mockResolvedValue([]);

      const alert = {
        type: 'FALL_DETECTED',
        data: { dispositivo_mac: 'AA:BB:CC:DD:EE:FF', severidad: 'high' }
      };

      await AlertService.broadcast(alert);

      expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('FALL_DETECTED'));
    });

    test('debería enviar alerta a cuidadores asignados', async () => {
      const mockResOwner: any = { setHeader: jest.fn(), write: jest.fn(), on: jest.fn().mockReturnThis() };
      const mockResCuidador: any = { setHeader: jest.fn(), write: jest.fn(), on: jest.fn().mockReturnThis() };

      AlertService.addClient(mockResOwner, 5, 'usuario');
      AlertService.addClient(mockResCuidador, 10, 'cuidador');

      // Limpiamos llamadas previas (mensajes de conexión)
      mockResOwner.write.mockClear();
      mockResCuidador.write.mockClear();

      const mockUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
      (mockUsuario.findByDispositivo as jest.Mock).mockResolvedValue({ id: 5 });
      (mockUsuario.getCuidadoresAsignados as jest.Mock).mockResolvedValue([{ id: 10 }]);

      const alert = {
        type: 'FALL_DETECTED',
        data: { dispositivo_mac: 'AA:BB:CC:DD:EE:FF', severidad: 'high' }
      };

      await AlertService.broadcast(alert);

      expect(mockResOwner.write).toHaveBeenCalledWith(expect.stringContaining('FALL_DETECTED'));
      expect(mockResCuidador.write).toHaveBeenCalledWith(expect.stringContaining('FALL_DETECTED'));
    });

    test('debería no enviar alerta a usuario no autorizado', async () => {
      const mockResOwner: any = { setHeader: jest.fn(), write: jest.fn(), on: jest.fn().mockReturnThis() };
      const mockResUnauthorized: any = { setHeader: jest.fn(), write: jest.fn(), on: jest.fn().mockReturnThis() };

      // 1. Añadimos clientes
      AlertService.addClient(mockResOwner, 5, 'usuario');
      AlertService.addClient(mockResUnauthorized, 20, 'usuario');

      // 2. IMPORTANTE: Limpiar mocks para ignorar el mensaje "Connected to..."
      mockResOwner.write.mockClear();
      mockResUnauthorized.write.mockClear();

      const mockUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
      (mockUsuario.findByDispositivo as jest.Mock).mockResolvedValue({ id: 5 });
      (mockUsuario.getCuidadoresAsignados as jest.Mock).mockResolvedValue([]);

      const alert = {
        type: 'FALL_DETECTED',
        data: { dispositivo_mac: 'AA:BB:CC:DD:EE:FF', severidad: 'high' }
      };

      // 3. Ejecutar broadcast
      await AlertService.broadcast(alert);

      // 4. Verificaciones
      expect(mockResOwner.write).toHaveBeenCalledWith(expect.stringContaining('FALL_DETECTED'));
      expect(mockResUnauthorized.write).not.toHaveBeenCalledWith(expect.stringContaining('FALL_DETECTED'));
      // Verificamos que no se haya llamado NADA después de la limpieza
      expect(mockResUnauthorized.write).not.toHaveBeenCalled();
    });

    test('debería manejar alerta sin dispositivo_mac', async () => {
      const mockRes: any = { setHeader: jest.fn(), write: jest.fn(), on: jest.fn().mockReturnThis() };
      AlertService.addClient(mockRes, 999, 'admin');
      
      mockRes.write.mockClear();

      const alert = {
        type: 'FALL_DETECTED',
        data: { severidad: 'high' } // Sin MAC
      };

      await AlertService.broadcast(alert);

      // Según tu log, si no hay MAC el servicio hace un warn y retorna sin enviar data
      expect(mockRes.write).not.toHaveBeenCalled();
    });

    test('debería enviar alerta a Discord', async () => {
      const mockUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
      (mockUsuario.findByDispositivo as jest.Mock).mockResolvedValue({ id: 5 });
      (mockUsuario.getCuidadoresAsignados as jest.Mock).mockResolvedValue([]);

      const alert = {
        type: 'FALL_DETECTED',
        data: {
          dispositivo_mac: 'AA:BB:CC:DD:EE:FF',
          severidad: 'high',
          is_fall_detected: true
        }
      };

      await AlertService.broadcast(alert);

      expect(DiscordService.sendAlert).toHaveBeenCalledWith(alert);
    });

    test('debería manejar error de broadcast gracefully', async () => {
      const mockUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
      (mockUsuario.findByDispositivo as jest.Mock).mockRejectedValue(new Error('Database error'));

      const alert = {
        type: 'FALL_DETECTED',
        data: { dispositivo_mac: 'AA:BB:CC:DD:EE:FF', severidad: 'high' }
      };

      // No debería lanzar error hacia arriba (el catch está dentro del service)
      await expect(AlertService.broadcast(alert)).resolves.not.toThrow();
    });
  });
});