import dotenv from 'dotenv';
dotenv.config();

import jwt from 'jsonwebtoken';

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes';
import esp32Routes from './routes/esp32Routes';
import userRoutes from './routes/userRoutes';
import eventRoutes from './routes/eventRoutes';
import authMiddleware, { AuthRequest } from './middleware/auth';
import { connectMQTT } from './config/mqtt';
import { SchedulerService } from './services/schedulerService';
import { AlertService } from './services/alertService';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'StepGuard Backend API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/esp32', esp32Routes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

// Protected Route Example
app.get('/api/protected', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// SSE Alert Stream
app.get('/api/alerts/stream', (req: Request, res: Response) => {
  const token = req.query.token as string;

  if (!token) {
    res.status(401).json({ message: 'Access denied. Token invalid or missing.' });
    return;
  }

  try {
    // Manually verify token since browsers don't send headers for EventSource
    // Assuming decoded token has structure: { id: number, role: 'usuario' | 'cuidador' | 'admin', ... }
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Pass user info to AlertService
    AlertService.addClient(res, decoded.id, decoded.role);
    
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectMQTT();
  SchedulerService.start();
});
