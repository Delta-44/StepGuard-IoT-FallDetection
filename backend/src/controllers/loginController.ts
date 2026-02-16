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

    // 1. Intentar encontrar usuario
    let user = await UsuarioModel.findByEmail(email);
    let role = 'usuario';
    let dbUser: any = user;

    // 2. Si no es usuario, intentar encontrar cuidador
    if (!user) {
      const caregiver = await CuidadorModel.findByEmail(email);
      if (caregiver) {
        dbUser = caregiver;
        // Determinar rol basado en el campo is_admin
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

    // Normalizar rol para JWT
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
