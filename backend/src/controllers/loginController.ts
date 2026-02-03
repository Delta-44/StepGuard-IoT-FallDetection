import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CuidadorModel } from '../models/cuidador';
import { UsuarioModel } from '../models/usuario';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Intentar buscar primero en cuidadores
    let cuidador = await CuidadorModel.findByEmail(email);
    if (cuidador) {
      const isMatch = await bcrypt.compare(password, cuidador.password_hash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: cuidador.id, email: cuidador.email, type: 'cuidador' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: cuidador.id,
          username: cuidador.email.split('@')[0],
          email: cuidador.email,
          fullName: cuidador.nombre,
          role: cuidador.is_admin ? 'admin' : 'caregiver',
          status: 'active',
          telefono: cuidador.telefono,
          is_admin: cuidador.is_admin,
          lastLogin: new Date()
        }
      });
    }

    // Si no es cuidador, buscar en usuarios (pacientes)
    const usuario = await UsuarioModel.findByEmail(email);
    if (usuario) {
      const isMatch = await bcrypt.compare(password, usuario.password_hash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: usuario.id, email: usuario.email, type: 'usuario' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: usuario.id,
          username: usuario.email.split('@')[0],
          email: usuario.email,
          fullName: usuario.nombre,
          role: 'user',
          status: 'active',
          telefono: usuario.telefono,
          edad: usuario.edad,
          direccion: usuario.direccion,
          lastLogin: new Date()
        }
      });
    }

    // Si no se encuentra ni como cuidador ni como usuario
    return res.status(400).json({ message: 'Invalid credentials' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
