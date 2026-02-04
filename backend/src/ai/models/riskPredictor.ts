/**
 * Predictor de Riesgo
 * Utiliza análisis estadístico y reglas heurísticas para predecir riesgo de caídas
 * Versión sin brain.js para evitar dependencias nativas
 */

import { mean, linearTrend, clamp } from '../utils/mathUtils';
import { logger } from '../utils/logger';
import { FEATURE_WEIGHTS, AI_CONFIG } from '../config';
import type { RiskPrediction, RiskFactor, ExtractedFeatures } from '../types';

export class RiskPredictor {
  private isModelLoaded: boolean = false;

  constructor() {
    // Inicialización básica
    this.isModelLoaded = true;
  }

  /**
   * Predice el riesgo basado en características extraídas
   * Usa únicamente análisis basado en reglas y estadística
   */
  async predict(features: Partial<ExtractedFeatures>): Promise<RiskPrediction> {
    // Usar solo sistema basado en reglas (más confiable y sin dependencias nativas)
    const ruleScore = this.predictWithRules(features);
    const riskScore = Math.round(clamp(ruleScore, 0, 100));

    // Determinar nivel de riesgo
    const riskLevel = this.determineRiskLevel(riskScore);

    // Calcular probabilidad
    const probability = riskScore / 100;

    // Calcular confianza basada en calidad de datos
    const confidence = this.calculateConfidence(features);

    // Identificar factores de riesgo
    const factors = this.identifyRiskFactors(features);

    // Calcular próximo tiempo de chequeo
    const nextCheckTime = this.calculateNextCheckTime(riskLevel);

    return {
      riskLevel,
      riskScore,
      probability,
      confidence,
      factors,
      nextCheckTime,
    };
  }

  /**
   * Predicción usando reglas determinísticas
   */
  private predictWithRules(features: Partial<ExtractedFeatures>): number {
    let score = 0;

    // Factor temporal (hora del día)
    if (features.hourOfDay !== undefined) {
      if (features.hourOfDay >= 22 || features.hourOfDay < 6) {
        score += 15; // Mayor riesgo de noche
      } else if (features.hourOfDay >= 6 && features.hourOfDay < 12) {
        score += 10; // Riesgo moderado en la mañana
      } else {
        score += 5; // Menor riesgo durante el día
      }
    }

    // Factor de magnitud de aceleración
    if (features.accelerationMagnitude !== undefined) {
      if (features.accelerationMagnitude > 20) {
        score += 25; // Aceleración muy alta
      } else if (features.accelerationMagnitude > 15) {
        score += 15; // Aceleración alta
      } else if (features.accelerationMagnitude > 10) {
        score += 5; // Aceleración normal-alta
      }
    }

    // Factor de varianza (inestabilidad)
    if (features.accelerationVariance !== undefined) {
      if (features.accelerationVariance > 10) {
        score += 20; // Muy inestable
      } else if (features.accelerationVariance > 5) {
        score += 10; // Moderadamente inestable
      }
    }

    // Factor de historial de caídas
    if (features.fallCount24h !== undefined) {
      score += features.fallCount24h * 10; // +10 por cada caída en 24h
    }

    if (features.fallCount7d !== undefined) {
      score += features.fallCount7d * 3; // +3 por cada caída en 7 días
    }

    // Factor de falsas alarmas (reduce el riesgo)
    if (features.falseAlarmRate !== undefined) {
      score -= features.falseAlarmRate * 20; // Reduce score si hay muchas falsas alarmas
    }

    // Factor de actividad
    if (features.activityLevel === 'high') {
      score += 15; // Alta actividad = mayor riesgo
    } else if (features.activityLevel === 'medium') {
      score += 8;
    } else if (features.activityLevel === 'low') {
      score += 3; // Baja actividad también puede ser preocupante
    }

    // Frecuencia de movimiento
    if (features.movementFrequency !== undefined) {
      if (features.movementFrequency > 5) {
        score += 10; // Movimiento muy frecuente
      } else if (features.movementFrequency > 2) {
        score += 5;
      }
    }

    return clamp(score, 0, 100);
  }

  /**
   * Determina el nivel de riesgo basado en el score
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    const thresholds = AI_CONFIG.alerts.thresholds;

    if (score >= thresholds.critical) return 'critical';
    if (score >= thresholds.high) return 'high';
    if (score >= thresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Calcula la confianza de la predicción
   */
  private calculateConfidence(features: Partial<ExtractedFeatures>): number {
    let confidence = 1.0;

    // Reducir confianza si faltan datos importantes
    const requiredFields = [
      'accelerationMagnitude',
      'fallCount24h',
      'activityLevel',
    ];

    const missingFields = requiredFields.filter(field => 
      features[field as keyof ExtractedFeatures] === undefined
    );

    confidence -= missingFields.length * 0.15;

    // Reducir confianza si datos históricos son limitados
    if ((features.fallCount7d || 0) < 2) {
      confidence *= 0.8;
    }

    return clamp(confidence, 0, 1);
  }

  /**
   * Identifica los factores de riesgo principales
   */
  private identifyRiskFactors(features: Partial<ExtractedFeatures>): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Factor: Caídas recientes
    if ((features.fallCount24h || 0) > 0) {
      factors.push({
        name: 'Recent Falls',
        value: features.fallCount24h || 0,
        weight: 0.25,
        impact: 'negative',
        description: `${features.fallCount24h} falls in the last 24 hours`,
      });
    }

    // Factor: Alta aceleración
    if ((features.accelerationMagnitude || 0) > 15) {
      factors.push({
        name: 'High Acceleration',
        value: features.accelerationMagnitude || 0,
        weight: 0.2,
        impact: 'negative',
        description: 'Unusual high acceleration detected',
      });
    }

    // Factor: Varianza alta (inestabilidad)
    if ((features.accelerationVariance || 0) > 5) {
      factors.push({
        name: 'Movement Instability',
        value: features.accelerationVariance || 0,
        weight: 0.15,
        impact: 'negative',
        description: 'High variance in movement patterns',
      });
    }

    // Factor: Hora de riesgo
    if (features.hourOfDay !== undefined && 
        (features.hourOfDay >= 22 || features.hourOfDay < 6)) {
      factors.push({
        name: 'High-Risk Time',
        value: features.hourOfDay,
        weight: 0.1,
        impact: 'negative',
        description: 'Nighttime has higher fall risk',
      });
    }

    // Factor positivo: Baja tasa de falsas alarmas
    if ((features.falseAlarmRate || 0) < 0.2) {
      factors.push({
        name: 'Low False Alarm Rate',
        value: features.falseAlarmRate || 0,
        weight: 0.1,
        impact: 'positive',
        description: 'Reliable sensor readings',
      });
    }

    // Ordenar por peso (más importantes primero)
    factors.sort((a, b) => b.weight - a.weight);

    return factors.slice(0, 5); // Retornar top 5
  }

  /**
   * Calcula cuándo hacer el próximo chequeo
   */
  private calculateNextCheckTime(riskLevel: 'low' | 'medium' | 'high' | 'critical'): Date {
    const now = new Date();
    let minutesToAdd = 60; // Default: 1 hora

    switch (riskLevel) {
      case 'critical':
        minutesToAdd = 5; // 5 minutos
        break;
      case 'high':
        minutesToAdd = 15; // 15 minutos
        break;
      case 'medium':
        minutesToAdd = 30; // 30 minutos
        break;
      case 'low':
        minutesToAdd = 120; // 2 horas
        break;
    }

    return new Date(now.getTime() + minutesToAdd * 60 * 1000);
  }

  /**
   * Libera recursos del modelo
   */
  dispose(): void {
    this.isModelLoaded = false;
    logger.info('Risk prediction model disposed');
  }
}

export const riskPredictor = new RiskPredictor();
