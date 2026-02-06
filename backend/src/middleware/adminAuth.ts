import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware to check if the user is an admin
 * Assumes authMiddleware has already run and populated req.user
 */
const adminAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: 'Access denied. No user authenticated.' });
    }

    // Check if the user has the 'admin' role
    // In our JWT, the role is stored in `role` property and can be 'admin'
    // Also checking `is_admin` property if present in the user object
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
