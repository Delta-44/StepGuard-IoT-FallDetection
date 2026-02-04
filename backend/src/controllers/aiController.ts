/**
 * Controlador de IA
 * Maneja las peticiones HTTP relacionadas con el sistema de IA
 */

import { Request, Response } from 'express';
import { aiService } from '../ai/aiService';
import { aiEngine } from '../ai/index';
import { logger } from '../ai/utils/logger';

/**
 * GET /api/ai/analyze/:userId
 * Análisis completo de un usuario
 */
export const analyzeUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    logger.info(`API request: Analyze user ${userId}`);

    const analysis = await aiService.analyzeUser(userId);

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    logger.error('Error in analyzeUser controller', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze user',
      error: error.message,
    });
  }
};

/**
 * GET /api/ai/risk/:deviceId
 * Análisis de riesgo de un dispositivo
 */
export const analyzeDeviceRisk = async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.deviceId as string;
    const deviceIdNum = parseInt(req.query.deviceIdNum as string) || 0;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required',
      });
    }

    logger.info(`API request: Analyze risk for device ${deviceId}`);

    const riskAnalysis = await aiService.analyzeDeviceRisk(deviceId, deviceIdNum);

    res.status(200).json({
      success: true,
      data: riskAnalysis,
    });
  } catch (error: any) {
    logger.error('Error in analyzeDeviceRisk controller', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze device risk',
      error: error.message,
    });
  }
};

/**
 * GET /api/ai/anomalies/:deviceId
 * Detección de anomalías
 */
export const detectAnomalies = async (req: Request, res: Response) => {
  try {
    const deviceId = req.params.deviceId as string;
    const timeWindow = parseInt(req.query.timeWindow as string) || 60;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required',
      });
    }

    logger.info(`API request: Detect anomalies for device ${deviceId}`);

    const anomalies = await aiService.detectAnomalies(deviceId, timeWindow);

    res.status(200).json({
      success: true,
      data: anomalies,
    });
  } catch (error: any) {
    logger.error('Error in detectAnomalies controller', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect anomalies',
      error: error.message,
    });
  }
};

/**
 * GET /api/ai/insights/:userId
 * Obtener insights de un usuario
 */
export const getUserInsights = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId as string);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    logger.info(`API request: Get insights for user ${userId}`);

    const insights = await aiService.getUserInsights(userId);

    res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    logger.error('Error in getUserInsights controller', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user insights',
      error: error.message,
    });
  }
};

/**
 * POST /api/ai/predict-fall
 * Predicción de caídas
 */
export const predictFall = async (req: Request, res: Response) => {
  try {
    const { deviceId, timeWindow = 24 } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required',
      });
    }

    logger.info(`API request: Predict fall for device ${deviceId}`);

    const prediction = await aiService.predictFall(deviceId, timeWindow);

    res.status(200).json({
      success: true,
      data: prediction,
    });
  } catch (error: any) {
    logger.error('Error in predictFall controller', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict fall',
      error: error.message,
    });
  }
};

/**
 * GET /api/ai/status
 * Estado del sistema de IA
 */
export const getAIStatus = async (req: Request, res: Response) => {
  try {
    const status = aiService.getSystemStatus();

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    logger.error('Error in getAIStatus controller', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI status',
      error: error.message,
    });
  }
};

/**
 * POST /api/ai/batch-analyze
 * Análisis por lotes
 */
export const batchAnalyze = async (req: Request, res: Response) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds array is required',
      });
    }

    logger.info(`API request: Batch analysis for ${userIds.length} users`);

    const results = await aiService.analyzeBatch(userIds);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    logger.error('Error in batchAnalyze controller', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform batch analysis',
      error: error.message,
    });
  }
};

/**
 * POST /api/ai/initialize
 * Inicializar motor de IA (para testing o reinicios)
 */
export const initializeAI = async (req: Request, res: Response) => {
  try {
    logger.info('API request: Initialize AI Engine');

    await aiEngine.initialize();

    res.status(200).json({
      success: true,
      message: 'AI Engine initialized successfully',
    });
  } catch (error: any) {
    logger.error('Error initializing AI Engine', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize AI Engine',
      error: error.message,
    });
  }
};

/**
 * GET /api/ai/health
 * Health check del sistema de IA
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    const isReady = aiEngine.isReady();
    const status = aiService.getSystemStatus();

    res.status(isReady ? 200 : 503).json({
      success: true,
      ready: isReady,
      status,
      timestamp: new Date(),
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      ready: false,
      message: 'AI system health check failed',
      error: error.message,
    });
  }
};
