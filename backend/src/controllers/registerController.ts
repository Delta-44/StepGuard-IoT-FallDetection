import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CuidadorModel } from '../models/cuidador';
import { UsuarioModel } from '../models/usuario';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const register = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      name,
      role = 'user',
      telefono,
      edad,
      direccion,
      is_admin = false
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password and name are required' });
    }

    // Verificar si el email ya existe en cuidadores o usuarios
    const existingCuidador = await CuidadorModel.findByEmail(email);
    const existingUsuario = await UsuarioModel.findByEmail(email);

    if (existingCuidador || existingUsuario) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear según el rol
    if (role === 'admin' || role === 'caregiver') {
      const newCuidador = await CuidadorModel.create(
        name,
        email,
        hashedPassword,
        telefono,
        role === 'admin'
      );

      const token = jwt.sign(
        { id: newCuidador.id, email: newCuidador.email, type: 'cuidador' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: newCuidador.id,
          username: newCuidador.email.split('@')[0],
          email: newCuidador.email,
          fullName: newCuidador.nombre,
          role: newCuidador.is_admin ? 'admin' : 'caregiver',
          status: 'active',
          telefono: newCuidador.telefono,
          is_admin: newCuidador.is_admin
        }
      });
    } else {
      // Crear como usuario/paciente
      const newUsuario = await UsuarioModel.create(
        name,
        email,
        hashedPassword,
        edad,
        direccion,
        telefono
      );

      const token = jwt.sign(
        { id: newUsuario.id, email: newUsuario.email, type: 'usuario' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: newUsuario.id,
          username: newUsuario.email.split('@')[0],
          email: newUsuario.email,
          fullName: newUsuario.nombre,
          role: 'user',
          status: 'active',
          telefono: newUsuario.telefono,
          edad: newUsuario.edad,
          direccion: newUsuario.direccion
        }
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
