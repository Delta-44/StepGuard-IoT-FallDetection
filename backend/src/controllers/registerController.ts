import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioModel } from '../models/usuario';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

import { CuidadorModel } from '../models/cuidador';

export const registerUsuario = async (req: Request, res: Response) => {
  try {
    const { email, password, name, edad, direccion, telefono, dispositivo_id } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await UsuarioModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UsuarioModel.create(
      name,
      email,
      hashedPassword,
      edad,
      direccion,
      telefono,
      dispositivo_id,
    );

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: 'usuario' }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.nombre, role: 'usuario' }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const registerCuidador = async (req: Request, res: Response) => {
  try {
    const { email, password, name, telefono, is_admin } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingCuidador = await CuidadorModel.findByEmail(email);
    if (existingCuidador) {
      return res.status(400).json({ message: 'Caregiver already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newCuidador = await CuidadorModel.create(
      name,
      email,
      hashedPassword,
      telefono,
      is_admin
    );

    const token = jwt.sign({ id: newCuidador.id, email: newCuidador.email, role: 'cuidador' }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'Caregiver registered successfully',
      token,
      user: { id: newCuidador.id, email: newCuidador.email, name: newCuidador.nombre, role: 'cuidador' }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
