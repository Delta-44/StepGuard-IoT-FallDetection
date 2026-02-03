
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { UsuarioModel } from '../models/usuario';
import { CuidadorModel } from '../models/cuidador';
import bcrypt from 'bcryptjs';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google token payload' });
    }

    const { email, name, sub: googleId } = payload;

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

    // 3. If user doesn't exist, create a new Usuario (default behavior)
    if (!dbUser) {
        // Generate a random password since they login with Google
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(randomPassword, salt);

        dbUser = await UsuarioModel.create(
            name || 'Google User',
            email,
            passwordHash,
            undefined, // age
            undefined, // address
            undefined, // phone
            undefined  // device_id
        );
        role = 'usuario'; // Default role
    }

    const jwtToken = jwt.sign({ id: dbUser.id, email: dbUser.email, role }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Google login successful',
      token: jwtToken,
      user: { id: dbUser.id, email: dbUser.email, name: dbUser.nombre, role }
    });

  } catch (error: any) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Google authentication failed', error: error.message });
  }
};
