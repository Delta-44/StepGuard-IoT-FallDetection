import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UsuarioModel } from '../models/usuario';
import { CuidadorModel } from '../models/cuidador';
import emailService from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'El email es requerido' });
      return;
    }

    // Buscar en usuarios
    let usuario = await UsuarioModel.findByEmail(email);
    let userType = 'usuario';

    // Si no es usuario, buscar en cuidadores
    if (!usuario) {
      const cuidador = await CuidadorModel.findByEmail(email);
      if (cuidador) {
        usuario = cuidador;
        userType = 'cuidador';
      }
    }

    if (!usuario) {
      // Por seguridad, no decimos si el usuario existe o no
      console.log(`Intento de recuperación de contraseña para email no existente: ${email}`);
      res.status(200).json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' });
      return;
    }

    // Generar JWT con el email y expiración de 1 hora
    const token = jwt.sign(
      { email: usuario.email, type: userType, purpose: 'reset-password' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // URL de reset
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:4200';
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

    // Verificar JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      res.status(400).json({ message: 'Token inválido o expirado' });
      return;
    }

    // Validar que sea un token de reset
    if (decoded.purpose !== 'reset-password') {
      res.status(400).json({ message: 'Token inválido' });
      return;
    }

    // Buscar usuario según el tipo
    let usuario;
    if (decoded.type === 'usuario') {
      usuario = await UsuarioModel.findByEmail(decoded.email);
    } else {
      usuario = await CuidadorModel.findByEmail(decoded.email);
    }

    if (!usuario) {
      res.status(400).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Validar que el token no se generó antes del último cambio de contraseña
    if (usuario.password_last_changed_at) {
      const tokenIssuedAt = decoded.iat * 1000; // JWT iat está en segundos, convertir a ms
      const lastPasswordChange = new Date(usuario.password_last_changed_at).getTime();

      if (tokenIssuedAt < lastPasswordChange) {
        res.status(400).json({ message: 'Token inválido o expirado' });
        return;
      }
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Actualizar contraseña
    if (decoded.type === 'usuario') {
      await UsuarioModel.updatePassword(usuario.id, passwordHash);
    } else {
      await CuidadorModel.updatePassword(usuario.id, passwordHash);
    }

    res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};