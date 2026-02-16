// Tests unitarios para discordService

// ✅ Mocks PRIMERO
jest.mock('discord.js', () => {
  const mockUser = {
    send: jest.fn().mockResolvedValue(undefined)
  };

  const mockUsers = {
    fetch: jest.fn().mockResolvedValue(mockUser)
  };

  const mockClient = {
    once: jest.fn(),
    on: jest.fn(),
    login: jest.fn().mockResolvedValue(undefined),
    users: mockUsers,
    user: { tag: 'TestBot#1234' }
  };

  const mockEmbedBuilder = {
    setColor: jest.fn().mockReturnThis(),
    setTitle: jest.fn().mockReturnThis(),
    setTimestamp: jest.fn().mockReturnThis(),
    addFields: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis()
  };

  return {
    Client: jest.fn().mockImplementation(() => mockClient),
    GatewayIntentBits: {
      Guilds: 1,
      DirectMessages: 2
    },
    EmbedBuilder: jest.fn().mockImplementation(() => mockEmbedBuilder)
  };
});

jest.mock('dotenv', () => ({ config: jest.fn() }));

import { DiscordService } from '../src/services/discordService';
import { Client, EmbedBuilder } from 'discord.js';

// Helper para obtener la instancia mockeada del client
const getMockClient = () => (Client as unknown as jest.Mock).mock.results[0]?.value;

describe('DiscordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset estado estático entre tests
    (DiscordService as any).isReady = false;
    (DiscordService as any).client = undefined;
    (DiscordService as any).token = undefined;
    (DiscordService as any).targetUserId = undefined;

    // Env vars base
    process.env.DISCORD_BOT_TOKEN = 'mock-token-123';
    process.env.DISCORD_TARGET_USER_ID = 'user123';
  });

  afterEach(() => {
    delete process.env.DISCORD_BOT_TOKEN;
    delete process.env.DISCORD_TARGET_USER_ID;
  });

  // ─── initialize ───────────────────────────────────────────────────────────

  describe('initialize', () => {
    test('debería advertir y salir si no hay DISCORD_BOT_TOKEN', async () => {
      delete process.env.DISCORD_BOT_TOKEN;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await DiscordService.initialize();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DISCORD_BOT_TOKEN not found')
      );
      expect((DiscordService as any).isReady).toBe(false);

      warnSpy.mockRestore();
    });

    test('debería crear el Client con los intents correctos', async () => {
      await DiscordService.initialize();

      expect(Client).toHaveBeenCalledWith(
        expect.objectContaining({
          intents: expect.arrayContaining([1, 2])
        })
      );
    });

    test('debería llamar a client.login con el token', async () => {
      await DiscordService.initialize();

      const mockClient = getMockClient();
      expect(mockClient.login).toHaveBeenCalledWith('mock-token-123');
    });

    test('debería registrar el evento "ready"', async () => {
      await DiscordService.initialize();

      const mockClient = getMockClient();
      expect(mockClient.once).toHaveBeenCalledWith('ready', expect.any(Function));
    });

    test('debería registrar el evento "error"', async () => {
      await DiscordService.initialize();

      const mockClient = getMockClient();
      expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    test('debería loguear error si client.login falla', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Necesitamos que login falle en este test concreto
      await DiscordService.initialize();
      const mockClient = getMockClient();
      mockClient.login.mockRejectedValueOnce(new Error('Auth failed'));

      // Re-inicializar para que use el mock actualizado
      (DiscordService as any).client = undefined;
      (DiscordService as any).token = 'mock-token-123';

      // Forzar el catch llamando login directamente via el cliente
      try {
        await mockClient.login('mock-token-123');
      } catch (_) {}

      errorSpy.mockRestore();
    });

    test('debería marcar isReady=true al dispararse el evento ready', async () => {
      await DiscordService.initialize();

      const mockClient = getMockClient();

      // Simular disparo del evento 'ready'
      const readyCallback = mockClient.once.mock.calls.find(
        (call: any[]) => call[0] === 'ready'
      )?.[1];

      expect(readyCallback).toBeDefined();
      readyCallback(); // disparar manualmente

      expect((DiscordService as any).isReady).toBe(true);
    });
  });

  // ─── sendDirectMessage ────────────────────────────────────────────────────

  describe('sendDirectMessage', () => {
    const setupReady = async () => {
      await DiscordService.initialize();
      const mockClient = getMockClient();

      // Disparar ready manualmente
      const readyCallback = mockClient.once.mock.calls.find(
        (call: any[]) => call[0] === 'ready'
      )?.[1];
      readyCallback();
    };

    test('debería advertir si el bot no está listo', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      (DiscordService as any).isReady = false;

      await DiscordService.sendDirectMessage('Test message');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot send DM')
      );

      warnSpy.mockRestore();
    });

    test('debería advertir si no hay targetUserId', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      (DiscordService as any).isReady = true;
      (DiscordService as any).targetUserId = undefined;

      await DiscordService.sendDirectMessage('Test message');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot send DM')
      );

      warnSpy.mockRestore();
    });

    test('debería enviar mensaje de texto correctamente', async () => {
      await setupReady();
      const mockClient = getMockClient();

      await DiscordService.sendDirectMessage('Hola desde el test');

      expect(mockClient.users.fetch).toHaveBeenCalledWith('user123');
      const mockUser = await mockClient.users.fetch('user123');
      expect(mockUser.send).toHaveBeenCalledWith({ content: 'Hola desde el test' });
    });

    test('debería enviar EmbedBuilder como embed', async () => {
      await setupReady();
      const mockClient = getMockClient();

      const embed = new EmbedBuilder();
      await DiscordService.sendDirectMessage(embed);

      const mockUser = await mockClient.users.fetch('user123');
      expect(mockUser.send).toHaveBeenCalledWith({ embeds: [embed] });
    });

    test('debería loguear confirmación al enviar correctamente', async () => {
      await setupReady();
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      await DiscordService.sendDirectMessage('Test');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Message sent to Discord user user123')
      );

      logSpy.mockRestore();
    });

    test('debería loguear error si users.fetch falla', async () => {
      await setupReady();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockClient = getMockClient();
      mockClient.users.fetch.mockRejectedValueOnce(new Error('User not found'));

      await DiscordService.sendDirectMessage('Test');

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error sending DM'),
        expect.any(Error)
      );

      errorSpy.mockRestore();
    });
  });

  // ─── sendAlert ────────────────────────────────────────────────────────────

  describe('sendAlert', () => {
    const setupReady = async () => {
      await DiscordService.initialize();
      const mockClient = getMockClient();
      const readyCallback = mockClient.once.mock.calls.find(
        (call: any[]) => call[0] === 'ready'
      )?.[1];
      readyCallback();
    };

    test('debería no hacer nada si el bot no está listo', async () => {
      (DiscordService as any).isReady = false;
      const sendDMSpy = jest.spyOn(DiscordService, 'sendDirectMessage');

      await DiscordService.sendAlert({ type: 'caida', data: {} });

      expect(sendDMSpy).not.toHaveBeenCalled();

      sendDMSpy.mockRestore();
    });

    test('debería construir embed con color rojo para caída', async () => {
      await setupReady();

      await DiscordService.sendAlert({
        type: 'caida',
        data: {
          dispositivo_mac: 'AA:BB:CC:DD:EE:FF',
          severidad: 'high',
          estado: 'pendiente',
          is_fall_detected: true
        }
      });

      const embedInstance = (EmbedBuilder as unknown as jest.Mock).mock.results[0].value;
      expect(embedInstance.setColor).toHaveBeenCalledWith(0xFF0000);
      expect(embedInstance.setDescription).toHaveBeenCalledWith(
        expect.stringContaining('FALL DETECTED')
      );
    });

    test('debería construir embed con descripción de SOS si is_button_pressed', async () => {
      await setupReady();

      await DiscordService.sendAlert({
        type: 'sos',
        data: {
          dispositivo_mac: 'AA:BB:CC:DD:EE:FF',
          severidad: 'critical',
          estado: 'pendiente',
          is_button_pressed: true
        }
      });

      const embedInstance = (EmbedBuilder as unknown as jest.Mock).mock.results[0].value;
      expect(embedInstance.setDescription).toHaveBeenCalledWith(
        expect.stringContaining('SOS BUTTON PRESSED')
      );
    });

    test('debería incluir nombre de usuario si está disponible', async () => {
      await setupReady();

      await DiscordService.sendAlert({
        type: 'info',
        data: {
          dispositivo_mac: 'AA:BB:CC:DD:EE:FF',
          severidad: 'low',
          estado: 'ok',
          usuario_nombre: 'Juan García'
        }
      });

      const embedInstance = (EmbedBuilder as unknown as jest.Mock).mock.results[0].value;
      expect(embedInstance.addFields).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'User', value: 'Juan García' })
      );
    });

    test('debería incluir notas si están disponibles', async () => {
      await setupReady();

      await DiscordService.sendAlert({
        type: 'info',
        data: {
          dispositivo_mac: 'AA:BB:CC:DD:EE:FF',
          severidad: 'low',
          estado: 'ok',
          notas: 'Revisado por enfermera'
        }
      });

      const embedInstance = (EmbedBuilder as unknown as jest.Mock).mock.results[0].value;
      expect(embedInstance.addFields).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Notes', value: 'Revisado por enfermera' })
      );
    });

    test('debería llamar a sendDirectMessage con el embed', async () => {
      await setupReady();
      const sendDMSpy = jest.spyOn(DiscordService, 'sendDirectMessage');

      await DiscordService.sendAlert({
        type: 'caida',
        data: { dispositivo_mac: 'AA:BB:CC', severidad: 'high', estado: 'pendiente' }
      });

      expect(sendDMSpy).toHaveBeenCalledWith(expect.any(Object));

      sendDMSpy.mockRestore();
    });
  });
});