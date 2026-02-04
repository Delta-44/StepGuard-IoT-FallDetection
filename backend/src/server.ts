import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes';
import esp32Routes from './routes/esp32Routes';
import userRoutes from './routes/userRoutes';
import aiRoutes from './routes/aiRoutes';
import authMiddleware, { AuthRequest } from './middleware/auth';
import { aiEngine } from './ai/index';

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
app.use('/api/ai', aiRoutes);

// Protected Route Example
app.get('/api/protected', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Initialize AI Engine and start server
const startServer = async () => {
  try {
    console.log('Initializing AI Engine...');
    await aiEngine.initialize();
    console.log('✓ AI Engine initialized successfully');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log('AI endpoints available at /api/ai/*');
    });
  } catch (error) {
    console.error('Failed to initialize AI Engine:', error);
    console.log('Server starting without AI capabilities...');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log('⚠️ AI Engine not initialized');
    });
  }
};

startServer();
