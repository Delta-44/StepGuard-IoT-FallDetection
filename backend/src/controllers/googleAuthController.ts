
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { UsuarioModel } from '../models/usuario';
import { CuidadorModel } from '../models/cuidador';
import bcrypt from 'bcryptjs';

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_SECRET,
  'http://localhost:3000/api/auth/google/callback'
);
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const googleAuthRedirect = (req: Request, res: Response) => {
  const authorizeUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });
  res.redirect(authorizeUrl);
};

export const googleAuthCallback = async (req: Request, res: Response) => {
    try {
        const { code } = req.query;
        if (!code) {
           return res.status(400).send('No code provided');
        }

        const { tokens } = await client.getToken(code as string);
        client.setCredentials(tokens);

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token!,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
             return res.status(400).send('Invalid Google token payload');
        }

        const { email, name } = payload;
        
        // 1. Find or create user logic (Shared with googleLogin)
        // For simplicity, I'll copy the finding logic here or refactor. 
        // Given constraint of single file edits, I will duplicate logic for now for safety.
        
        let user = await UsuarioModel.findByEmail(email);
        let role = 'usuario';
        let dbUser: any = user;

        if (!user) {
            const caregiver = await CuidadorModel.findByEmail(email);
            if (caregiver) {
                dbUser = caregiver;
                role = 'cuidador';
            }
        }

        if (!dbUser) {
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(randomPassword, salt);

            dbUser = await UsuarioModel.create(
                name || 'Google User',
                email,
                passwordHash,
                undefined, undefined, undefined, undefined
            );
            role = 'usuario';
        }

        const jwtToken = jwt.sign({ id: dbUser.id, email: dbUser.email, role }, JWT_SECRET, { expiresIn: '1h' });

        // Redirect back to frontend with token
        res.redirect(`http://localhost:4200/login?token=${jwtToken}`);

    } catch (error) {
        console.error('Error in Google callback', error);
        res.status(500).send('Authentication failed');
    }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token, role: requestedRole } = req.body;

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
    const user = await UsuarioModel.findByEmail(email);
    
    if (user) {
        const jwtToken = jwt.sign({ id: user.id, email: user.email, role: 'usuario' }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({
            message: 'Google login successful',
            token: jwtToken,
            user: { id: user.id, email: user.email, name: user.nombre, role: 'usuario' }
        });
    }

    // 2. If not user, try to find caregiver
    const caregiver = await CuidadorModel.findByEmail(email);
    if (caregiver) {
        const jwtToken = jwt.sign({ id: caregiver.id, email: caregiver.email, role: 'cuidador' }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({
            message: 'Google login successful',
            token: jwtToken,
            user: { id: caregiver.id, email: caregiver.email, name: caregiver.nombre, role: 'cuidador' }
        });
    }

    // 3. If user/caregiver doesn't exist, check if role is provided
    if (!requestedRole) {
        // Return 200/202 with isNewUser flag to prompt frontend
        return res.status(200).json({
            isNewUser: true,
            email,
            name,
            googleToken: token, // Return token so frontend can send it back with role
            message: 'User not registered. Please select a role.'
        });
    }

    // 4. Create new account based on requestedRole
    let newUser: any;
    let finalRole = '';

    // Generate a random password since they login with Google
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(randomPassword, salt);

    if (requestedRole === 'usuario') {
        newUser = await UsuarioModel.create(
            name || 'Google User',
            email,
            passwordHash,
            undefined, // fecha_nacimiento
            undefined, // direccion
            undefined, // telefono
            undefined  // dispositivo_mac
        );
        finalRole = 'usuario';
    } else if (requestedRole === 'cuidador') {
        newUser = await CuidadorModel.create(
            name || 'Google Caregiver',
            email,
            passwordHash,
            undefined, // phone
            false // is_admin
        );
        finalRole = 'cuidador';
    } else {
        return res.status(400).json({ message: 'Invalid role selected. Must be "usuario" or "cuidador".' });
    }

    const jwtToken = jwt.sign({ id: newUser.id, email: newUser.email, role: finalRole }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: 'Google registration successful',
      token: jwtToken,
      user: { id: newUser.id, email: newUser.email, name: newUser.nombre, role: finalRole }
    });

  } catch (error: any) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Google authentication failed', error: error.message });
  }
};
