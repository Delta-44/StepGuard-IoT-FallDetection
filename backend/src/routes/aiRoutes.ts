/**
 * Rutas de IA
 * Define los endpoints del sistema de IA
 */

import { Router } from 'express';
import {
  analyzeUser,
  analyzeDeviceRisk,
  detectAnomalies,
  getUserInsights,
  predictFall,
  getAIStatus,
  batchAnalyze,
  initializeAI,
  healthCheck,
} from '../controllers/aiController';
// import authenticateToken from '../middleware/auth';

const router = Router();

// Aplicar autenticación a todas las rutas de IA
// Comentar esta línea si quieres testear sin autenticación
// router.use(authenticateToken);

/**
 * @route   GET /api/ai/health
 * @desc    Health check del sistema de IA
 * @access  Public
 */
router.get('/health', healthCheck);

/**
 * @route   GET /api/ai/status
 * @desc    Estado del sistema de IA
 * @access  Private
 */
router.get('/status', getAIStatus);

/**
 * @route   POST /api/ai/initialize
 * @desc    Inicializar motor de IA
 * @access  Private (Admin only)
 */
router.post('/initialize', initializeAI);

/**
 * @route   GET /api/ai/analyze/:userId
 * @desc    Análisis completo de un usuario
 * @access  Private
 */
router.get('/analyze/:userId', analyzeUser);

/**
 * @route   GET /api/ai/risk/:deviceId
 * @desc    Análisis de riesgo de un dispositivo
 * @access  Private
 * @query   deviceIdNum (opcional) - ID numérico del dispositivo
 */
router.get('/risk/:deviceId', analyzeDeviceRisk);

/**
 * @route   GET /api/ai/anomalies/:deviceId
 * @desc    Detección de anomalías
 * @access  Private
 * @query   timeWindow (opcional) - Ventana de tiempo en minutos (default: 60)
 */
router.get('/anomalies/:deviceId', detectAnomalies);

/**
 * @route   GET /api/ai/insights/:userId
 * @desc    Obtener insights de un usuario
 * @access  Private
 */
router.get('/insights/:userId', getUserInsights);

/**
 * @route   POST /api/ai/predict-fall
 * @desc    Predicción de caídas
 * @access  Private
 * @body    { deviceId: string, timeWindow?: number }
 */
router.post('/predict-fall', predictFall);

/**
 * @route   POST /api/ai/batch-analyze
 * @desc    Análisis por lotes de múltiples usuarios
 * @access  Private (Admin only)
 * @body    { userIds: number[] }
 */
router.post('/batch-analyze', batchAnalyze);

export default router;
