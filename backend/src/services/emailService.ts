import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const mailOptions = {
      from: `"StepGuard IoT" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Recuperación de Contraseña - StepGuard',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Recuperación de Contraseña</h2>
          <p>Has solicitado restablecer tu contraseña en StepGuard IoT.</p>
          <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Restablecer Contraseña</a>
          <p>Este enlace expirará en 1 hora.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">StepGuard IoT - Seguridad para tus seres queridos</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
    } catch (error) {
      console.error('Error sending email:', error);
      // Fallback para desarrollo: Registrar la URL para poder probar
      if (process.env.NODE_ENV !== 'production') {
        console.log('[MODO DEV] Falló el envío de correo. Aquí está el enlace de recuperación:');
        console.log(resetUrl);
        return; // No lanzar error, tratar como "enviado" para flujo de desarrollo
      }
      throw new Error('Error al enviar el correo de recuperación');
    }
  }
}

export default new EmailService();
