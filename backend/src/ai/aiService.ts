/**
 * Servicio de IA
 * Capa de servicio que conecta los controladores con el motor de IA
 */

import { aiEngine } from './index';
import { dataAggregator } from './collectors/dataAggregator';
import { featureExtractor } from './preprocessing/featureExtractor';
import { dataValidator } from './preprocessing/dataValidator';
import { anomalyDetector } from './models/anomalyDetector';
import { riskPredictor } from './models/riskPredictor';
import { patternAnalyzer } from './models/patternAnalyzer';
import { alertGenerator } from './decision/alertGenerator';
import { riskScorer } from './decision/riskScorer';
import { recommendationEngine } from './decision/recommendationEngine';
import { logger } from './utils/logger';
import type { ComprehensiveAnalysis } from './types';

export class AIService {
  /**
   * Análisis completo de un usuario
   */
  async analyzeUser(userId: number): Promise<ComprehensiveAnalysis> {
    try {
      const startTime = Date.now();
      logger.info(`Starting comprehensive analysis for user ${userId}`);

      // 1. Recolectar y agregar datos
      const aggregatedData = await dataAggregator.aggregateUserData(userId, 30);

      if (!aggregatedData || !aggregatedData.events || aggregatedData.events.length === 0) {
        logger.warn(`Insufficient data for user ${userId}`);
        return this.createEmptyAnalysis(userId);
      }

      // 2. Validar calidad de datos
      const dataQuality = dataValidator.calculateDataQuality([], aggregatedData.events);

      // 3. Extraer características
      const features = featureExtractor.extractFromHistoricalEvents(
        aggregatedData.events,
        24
      );

      // 4. Ejecutar modelos de IA
      const [prediction, patterns] = await Promise.all([
        riskPredictor.predict(features),
        Promise.resolve(patternAnalyzer.analyze(aggregatedData.events, 30)),
      ]);

      // 5. Detectar anomalías (usando datos históricos)
      const anomalies = anomalyDetector.detect(
        aggregatedData.statistics?.totalEvents || 0,
        [aggregatedData.statistics?.totalEvents || 0]
      );

      // 6. Calcular score final
      const finalRiskScore = riskScorer.calculateFinalScore(
        prediction,
        anomalies,
        features
      );

      // 7. Generar alertas
      const alerts = [];
      const riskAlert = alertGenerator.generateRiskAlert(userId, 'unknown', prediction);
      if (riskAlert) alerts.push(riskAlert);

      const anomalyAlert = alertGenerator.generateAnomalyAlert(userId, 'unknown', anomalies);
      if (anomalyAlert) alerts.push(anomalyAlert);

      // 8. Generar recomendaciones
      const recommendations = recommendationEngine.generate(
        userId,
        prediction,
        patterns,
        features
      );

      // 9. Construir análisis completo
      const analysis: ComprehensiveAnalysis = {
        userId,
        deviceId: 'multiple',
        timestamp: new Date(),
        currentState: {
          riskScore: finalRiskScore,
          riskLevel: prediction.riskLevel,
          isAnomalous: anomalies.isAnomaly,
        },
        predictions: prediction,
        anomalies,
        patterns,
        recommendations,
        alerts,
        metadata: {
          analysisVersion: '1.0.0',
          processingTime: Date.now() - startTime,
          dataQuality,
          confidence: prediction.confidence,
        },
      };

      logger.success(`Analysis completed for user ${userId}`, {
        processingTime: analysis.metadata.processingTime,
        riskScore: finalRiskScore,
        alertCount: alerts.length,
      });

      return analysis;
    } catch (error) {
      logger.error(`Error analyzing user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Análisis de riesgo para un dispositivo específico
   */
  async analyzeDeviceRisk(deviceId: string, deviceIdNum: number): Promise<any> {
    try {
      logger.debug(`Analyzing risk for device ${deviceId}`);

      // Agregar datos del dispositivo
      const deviceData = await dataAggregator.aggregateDeviceData(
        deviceId,
        deviceIdNum,
        60
      );

      if (!deviceData.realtime.history || deviceData.realtime.history.length === 0) {
        return {
          deviceId,
          riskScore: 0,
          riskLevel: 'low',
          message: 'Insufficient data',
          confidence: 0,
        };
      }

      // Extraer características
      const current = deviceData.realtime.current || deviceData.realtime.history[0];
      const features = featureExtractor.extractFromSensorData(
        current,
        deviceData.realtime.history
      );

      // Predecir riesgo
      const prediction = await riskPredictor.predict(features);

      // Detectar anomalías
      const anomalies = anomalyDetector.detectInSensorData(
        current,
        deviceData.realtime.history
      );

      // Calcular score final
      const finalScore = riskScorer.calculateFinalScore(
        prediction,
        anomalies,
        features
      );

      return {
        deviceId,
        riskScore: finalScore,
        riskLevel: prediction.riskLevel,
        prediction,
        anomalies,
        features,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Error analyzing device risk for ${deviceId}`, error);
      throw error;
    }
  }

  /**
   * Detección de anomalías en tiempo real
   */
  async detectAnomalies(deviceId: string, timeWindowMinutes: number = 60): Promise<any> {
    try {
      logger.debug(`Detecting anomalies for device ${deviceId}`);

      // Obtener datos históricos del dispositivo
      // Por ahora retornar estructura básica
      // TODO: Implementar con datos reales

      return {
        deviceId,
        timeWindow: timeWindowMinutes,
        anomalies: [],
        summary: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Error detecting anomalies for device ${deviceId}`, error);
      throw error;
    }
  }

  /**
   * Obtener insights de un usuario
   */
  async getUserInsights(userId: number): Promise<any> {
    try {
      logger.debug(`Getting insights for user ${userId}`);

      // Agregar datos del usuario
      const userData = await dataAggregator.aggregateUserData(userId, 30);

      if (!userData.events || userData.events.length < 5) {
        return {
          userId,
          insights: ['Insufficient data to generate insights'],
          recommendations: [],
          patterns: [],
          trends: [],
        };
      }

      // Analizar patrones
      const patterns = patternAnalyzer.analyze(userData.events, 30);

      // Extraer características
      const features = featureExtractor.extractFromHistoricalEvents(
        userData.events,
        24
      );

      // Predecir riesgo
      const prediction = await riskPredictor.predict(features);

      // Generar recomendaciones
      const recommendations = recommendationEngine.generate(
        userId,
        prediction,
        patterns,
        features
      );

      return {
        userId,
        insights: patterns.insights,
        recommendations: recommendations.slice(0, 5), // Top 5
        patterns: patterns.patterns.slice(0, 5),
        trends: patterns.trends,
        statistics: userData.statistics,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Error getting insights for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Predicción de caídas
   */
  async predictFall(deviceId: string, timeWindowHours: number = 24): Promise<any> {
    try {
      logger.debug(`Predicting falls for device ${deviceId}`);

      // TODO: Implementar predicción de caídas con datos reales

      return {
        deviceId,
        timeWindow: timeWindowHours,
        prediction: {
          probability: 0,
          riskLevel: 'low',
          nextCheckTime: new Date(Date.now() + 60 * 60 * 1000),
        },
        factors: [],
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error(`Error predicting fall for device ${deviceId}`, error);
      throw error;
    }
  }

  /**
   * Análisis batch (para procesar múltiples usuarios)
   */
  async analyzeBatch(userIds: number[]): Promise<any> {
    try {
      logger.info(`Starting batch analysis for ${userIds.length} users`);

      const results = await Promise.allSettled(
        userIds.map(userId => this.analyzeUser(userId))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info(`Batch analysis completed: ${successful} successful, ${failed} failed`);

      return {
        total: userIds.length,
        successful,
        failed,
        results: results.map((r, i) => ({
          userId: userIds[i],
          status: r.status,
          data: r.status === 'fulfilled' ? r.value : null,
          error: r.status === 'rejected' ? r.reason : null,
        })),
      };
    } catch (error) {
      logger.error('Error in batch analysis', error);
      throw error;
    }
  }

  /**
   * Estado del sistema de IA
   */
  getSystemStatus(): any {
    return aiEngine.getStatus();
  }

  /**
   * Crear análisis vacío cuando no hay datos
   */
  private createEmptyAnalysis(userId: number): ComprehensiveAnalysis {
    return {
      userId,
      deviceId: 'unknown',
      timestamp: new Date(),
      currentState: {
        riskScore: 0,
        riskLevel: 'low',
        isAnomalous: false,
      },
      predictions: {
        riskLevel: 'low',
        riskScore: 0,
        probability: 0,
        confidence: 0,
        factors: [],
      },
      anomalies: {
        isAnomaly: false,
        anomalyScore: 0,
        zScore: 0,
        threshold: 3.0,
        confidence: 0,
        reason: 'Insufficient data',
      },
      patterns: {
        patterns: [],
        trends: [],
        insights: ['Insufficient data for pattern analysis'],
      },
      recommendations: [],
      alerts: [],
      metadata: {
        analysisVersion: '1.0.0',
        processingTime: 0,
        dataQuality: 0,
        confidence: 0,
      },
    };
  }
}

export const aiService = new AIService();
