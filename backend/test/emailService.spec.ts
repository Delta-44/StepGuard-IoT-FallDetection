// Tests unitarios para emailService

jest.mock('nodemailer');
jest.mock('dotenv');

import nodemailer from 'nodemailer';

const mockedNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

describe('EmailService', () => {
  let mockTransporter: any;
  let EmailService: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules(); // 🔑 Fuerza reimportar el módulo en cada test

    // Configurar variables de entorno ANTES de reimportar
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'test@gmail.com';
    process.env.SMTP_PASS = 'password123';
    process.env.NODE_ENV = 'test';

    // Mock del transporter
    mockTransporter = {
      sendMail: jest.fn()
    };

    // Re-mockear nodemailer ANTES de reimportar el servicio
    const nodemailerMock = require('nodemailer');
    nodemailerMock.createTransport = jest.fn().mockReturnValue(mockTransporter);

    // Reimportar el servicio para que el constructor use nuestro mock
    EmailService = (await import('../src/services/emailService')).default;
  });

  describe('sendPasswordResetEmail', () => {
    test('debería enviar email de recuperación de contraseña correctamente', async () => {
      const resetUrl = 'http://localhost:3000/reset?token=abc123';
      const toEmail = 'user@example.com';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });

      await EmailService.sendPasswordResetEmail(toEmail, resetUrl);

      const nodemailerMock = require('nodemailer');
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"StepGuard IoT" <test@gmail.com>',
          to: toEmail,
          subject: 'Recuperación de Contraseña - StepGuard',
          html: expect.stringContaining('reset')
        })
      );
    });

    test('debería incluir URL de recuperación en el email', async () => {
      const resetUrl = 'http://localhost:3000/reset?token=xyz789';
      const toEmail = 'user@example.com';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });

      await EmailService.sendPasswordResetEmail(toEmail, resetUrl);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(resetUrl)
        })
      );
    });

    test('debería lanzar error en producción si el email falla', async () => {
      process.env.NODE_ENV = 'production';
      const resetUrl = 'http://localhost:3000/reset?token=abc123';
      const toEmail = 'user@example.com';

      mockTransporter.sendMail.mockRejectedValue(
        new Error('SMTP error: Connection refused')
      );

      await expect(
        EmailService.sendPasswordResetEmail(toEmail, resetUrl)
      ).rejects.toThrow('Error al enviar el correo de recuperación');
    });

    test('debería no lanzar error en modo desarrollo si falla', async () => {
      process.env.NODE_ENV = 'development';
      const resetUrl = 'http://localhost:3000/reset?token=abc123';
      const toEmail = 'user@example.com';

      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(
        EmailService.sendPasswordResetEmail(toEmail, resetUrl)
      ).resolves.not.toThrow();
    });

    test('debería formatear correctamente el HTML del email', async () => {
      const resetUrl = 'http://localhost:3000/reset?token=abc123';
      const toEmail = 'user@example.com';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });

      await EmailService.sendPasswordResetEmail(toEmail, resetUrl);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('font-family');
      expect(callArgs.html).toContain('Recuperación de Contraseña');
      expect(callArgs.html).toContain('StepGuard IoT');
    });

    test('debería mencionar que el link expira en 1 hora', async () => {
      const resetUrl = 'http://localhost:3000/reset?token=abc123';
      const toEmail = 'user@example.com';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });

      await EmailService.sendPasswordResetEmail(toEmail, resetUrl);

      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('1 hora');
    });

    test('debería usar configuración SMTP correcta', async () => {
      const resetUrl = 'http://localhost:3000/reset?token=abc123';
      const toEmail = 'user@example.com';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });

      await EmailService.sendPasswordResetEmail(toEmail, resetUrl);

      const nodemailerMock = require('nodemailer');
      expect(nodemailerMock.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: 'test@gmail.com',
            pass: 'password123'
          }
        })
      );
    });

    test('debería enviar a la dirección de email correcta', async () => {
      const resetUrl = 'http://localhost:3000/reset?token=abc123';
      const toEmail = 'john.doe@example.com';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });

      await EmailService.sendPasswordResetEmail(toEmail, resetUrl);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john.doe@example.com'
        })
      );
    });

    test('debería log message ID cuando envío es exitoso', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const resetUrl = 'http://localhost:3000/reset?token=abc123';
      const toEmail = 'user@example.com';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg12345' });

      await EmailService.sendPasswordResetEmail(toEmail, resetUrl);

expect(consoleLogSpy).toHaveBeenCalledWith(
  expect.stringContaining('Message sent'),
  expect.any(String)  // ✅ el segundo argumento (messageId)
);

      consoleLogSpy.mockRestore();
    });

    test('debería log reset URL en modo desarrollo si falla', async () => {
      process.env.NODE_ENV = 'development';
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const resetUrl = 'http://localhost:3000/reset?token=abc123';
      const toEmail = 'user@example.com';

      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP failed'));

      await EmailService.sendPasswordResetEmail(toEmail, resetUrl);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(resetUrl)
      );

      consoleLogSpy.mockRestore();
    });

    test('debería manejar caracteres especiales en email', async () => {
      const resetUrl = 'http://localhost:3000/reset?token=abc123&special=@#$';
      const toEmail = 'user+tag@example.com';

      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg123' });

      await EmailService.sendPasswordResetEmail(toEmail, resetUrl);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user+tag@example.com',
          html: expect.stringContaining(resetUrl)
        })
      );
    });

    test('debería usar secure: true para puerto 465', async () => {
      // Resetear módulos y reimportar con nuevas env vars
      jest.resetModules();
      process.env.SMTP_PORT = '465';
      process.env.SMTP_SECURE = 'true';

      const nodemailerMock = require('nodemailer');
      nodemailerMock.createTransport = jest.fn().mockReturnValue(mockTransporter);

      // Reimportar para que el constructor use SMTP_PORT=465
      await import('../src/services/emailService');

      expect(nodemailerMock.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          secure: true
        })
      );
    });
  });
});