import { Request, Response } from 'express';
import { UsuarioModel } from '../models/usuario';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await UsuarioModel.findAll();
    const safeUsers = users.map(user => {
      const { password_hash, ...safeUser } = user;
      return safeUser;
    });
    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};
