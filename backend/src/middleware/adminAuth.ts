import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware para verificar si el usuario es administrador
 * Asume que authMiddleware ya se ha ejecutado y ha poblado req.user
 */
const adminAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied. No user authenticated.' });
    }

    // Verificar si el usuario tiene el rol 'admin'
    // En nuestro JWT, el rol se almacena en la propiedad `role` y puede ser 'admin'
    // También verificando la propiedad `is_admin` si está presente en el objeto usuario
    if (req.user.role === 'admin' || req.user.is_admin === true) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
  } catch (error) {
    console.error('Error in admin middleware:', error);
    res.status(500).json({ message: 'Server error in admin authorization' });
  }
};

export default adminAuthMiddleware;
