import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioModel } from '../models/usuario';
import { CuidadorModel } from '../models/cuidador';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // 1. Try to find user
    let user = await UsuarioModel.findByEmail(email);
    let role = 'usuario';
    let dbUser: any = user;

    // 2. If not user, try to find caregiver
    if (!user) {
      const caregiver = await CuidadorModel.findByEmail(email);
      if (caregiver) {
        dbUser = caregiver;
        // Determine role based on is_admin field
            role = caregiver.is_admin ? 'admin' : 'cuidador';
      }
    }

    if (!dbUser) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, dbUser.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Normalize role for JWT
    let jwtRole = 'user';
    if (role === 'admin') jwtRole = 'admin';
    if (role === 'cuidador') jwtRole = 'caregiver';

    const token = jwt.sign({ id: dbUser.id, email: dbUser.email, role: jwtRole }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.nombre,
        username: dbUser.nombre,
        role: role === "usuario" ? "user" : role,
        fecha_nacimiento: dbUser.fecha_nacimiento,
        telefono: dbUser.telefono,
        direccion: dbUser.direccion,
        dispositivo_mac: dbUser.dispositivo_mac,
        foto_perfil: dbUser.foto_perfil,
        is_admin: dbUser.is_admin || false,
        status: "active" as const,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
