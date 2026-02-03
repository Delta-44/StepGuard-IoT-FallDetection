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
            role = 'cuidador';
        }
    }

    if (!dbUser) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, dbUser.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: dbUser.id, email: dbUser.email, role }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: dbUser.id, email: dbUser.email, name: dbUser.nombre, role }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
