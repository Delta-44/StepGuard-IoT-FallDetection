import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { UsuarioModel } from '../models/usuario';
import emailService from '../services/emailService';

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'El email es requerido' });
      return;
    }

    const usuario = await UsuarioModel.findByEmail(email);
    if (!usuario) {
      // Por seguridad, no decimos si el usuario existe o no, pero logueamos
      console.log(`Intento de recuperación de contraseña para email no existente: ${email}`);
      res.status(200).json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' });
      return;
    }

    // Generar token
    const token = crypto.randomBytes(20).toString('hex');
    // Expiración: 1 hora
    const expires = new Date(Date.now() + 3600000);

    await UsuarioModel.saveResetToken(usuario.id, token, expires);

    // URL de reset (asumiendo frontend en localhost:5173 o variable de entorno)
    // Deberíamos usar una variable de entorno para el FRONTEND_URL
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await emailService.sendPasswordResetEmail(email, resetUrl);

    res.status(200).json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ message: 'Token y contraseña son requeridos' });
      return;
    }

    const usuario = await UsuarioModel.findByResetToken(token);
    if (!usuario) {
      res.status(400).json({ message: 'Token inválido o expirado' });
      return;
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await UsuarioModel.updatePassword(usuario.id, passwordHash);

    res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
