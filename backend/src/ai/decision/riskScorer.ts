/**
 * Scorer de Riesgo
 * Calcula y combina múltiples scores para determinar el riesgo final
 */

import { logger } from '../utils/logger';
import { clamp, mean } from '../utils/mathUtils';
import { FEATURE_WEIGHTS, AI_CONFIG } from '../config';
import type { RiskPrediction, AnomalyResult, ExtractedFeatures } from '../types';

export class RiskScorer {
  /**
   * Calcula el score de riesgo final combinando múltiples fuentes
   */
  calculateFinalScore(
    prediction: RiskPrediction,
    anomaly: AnomalyResult,
    features: Partial<ExtractedFeatures>
  ): number {
    const weights = {
      prediction: 0.4,
      anomaly: 0.3,
      historical: 0.2,
      temporal: 0.1,
    };

    // Score de predicción (ya viene en 0-100)
    const predictionScore = prediction.riskScore;

    // Score de anomalía (convertir a 0-100)
    const anomalyScore = anomaly.isAnomaly ? anomaly.anomalyScore * 100 : 0;

    // Score histórico
    const historicalScore = this.calculateHistoricalScore(features);

    // Score temporal
    const temporalScore = this.calculateTemporalScore(features);

    // Combinar con pesos
    const finalScore =
      predictionScore * weights.prediction +
      anomalyScore * weights.anomaly +
      historicalScore * weights.historical +
      temporalScore * weights.temporal;

    return Math.round(clamp(finalScore, 0, 100));
  }

  /**
   * Calcula score basado en historial
   */
  private calculateHistoricalScore(features: Partial<ExtractedFeatures>): number {
    let score = 0;

    // Caídas recientes
    if (features.fallCount24h !== undefined) {
      score += Math.min(40, features.fallCount24h * 10);
    }

    // Caídas en la semana
    if (features.fallCount7d !== undefined) {
      score += Math.min(30, features.fallCount7d * 3);
    }

    // Tasa de falsas alarmas (reduce el score)
    if (features.falseAlarmRate !== undefined) {
      score -= features.falseAlarmRate * 30;
    }

    // Frecuencia de movimiento
    if (features.movementFrequency !== undefined) {
      if (features.movementFrequency > 5) {
        score += 20; // Muy activo
      } else if (features.movementFrequency > 2) {
        score += 10;
      } else if (features.movementFrequency < 0.5) {
        score += 15; // Muy inactivo también es preocupante
      }
    }

    return clamp(score, 0, 100);
  }

  /**
   * Calcula score basado en factores temporales
   */
  private calculateTemporalScore(features: Partial<ExtractedFeatures>): number {
    let score = 20; // Base score

    // Hora del día
    if (features.hourOfDay !== undefined) {
      const hour = features.hourOfDay;
      if (hour >= 22 || hour < 6) {
        score += 40; // Noche (más riesgo)
      } else if (hour >= 6 && hour < 12) {
        score += 20; // Mañana
      } else {
        score += 10; // Día
      }
    }

    // Día de la semana (fin de semana puede tener menos supervisión)
    if (features.dayOfWeek !== undefined) {
      if (features.dayOfWeek === 0 || features.dayOfWeek === 6) {
        score += 15; // Fin de semana
      }
    }

    return clamp(score, 0, 100);
  }

  /**
   * Calcula score ponderado basado en características individuales
   */
  calculateWeightedScore(features: Partial<ExtractedFeatures>): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Características temporales
    if (features.hourOfDay !== undefined) {
      const hourScore = this.scoreHourOfDay(features.hourOfDay);
      totalScore += hourScore * FEATURE_WEIGHTS.temporal.hourOfDay;
      totalWeight += FEATURE_WEIGHTS.temporal.hourOfDay;
    }

    // Características del sensor
    if (features.accelerationMagnitude !== undefined) {
      const magScore = this.scoreMagnitude(features.accelerationMagnitude);
      totalScore += magScore * FEATURE_WEIGHTS.sensor.accelerationMagnitude;
      totalWeight += FEATURE_WEIGHTS.sensor.accelerationMagnitude;
    }

    if (features.accelerationVariance !== undefined) {
      const varScore = this.scoreVariance(features.accelerationVariance);
      totalScore += varScore * FEATURE_WEIGHTS.sensor.accelerationVariance;
      totalWeight += FEATURE_WEIGHTS.sensor.accelerationVariance;
    }

    // Características históricas
    if (features.fallCount24h !== undefined) {
      const fallScore = Math.min(100, features.fallCount24h * 20);
      totalScore += fallScore * FEATURE_WEIGHTS.historical.fallCount24h;
      totalWeight += FEATURE_WEIGHTS.historical.fallCount24h;
    }

    // Normalizar por peso total
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return Math.round(clamp(finalScore, 0, 100));
  }

  /**
   * Asigna score a la hora del día
   */
  private scoreHourOfDay(hour: number): number {
    if (hour >= 22 || hour < 6) return 80; // Noche
    if (hour >= 6 && hour < 9) return 60;  // Mañana temprano
    if (hour >= 18 && hour < 22) return 50; // Noche temprana
    return 30; // Día
  }

  /**
   * Asigna score a la magnitud de aceleración
   */
  private scoreMagnitude(magnitude: number): number {
    if (magnitude > 25) return 100;
    if (magnitude > 20) return 80;
    if (magnitude > 15) return 60;
    if (magnitude > 12) return 40;
    if (magnitude > 10) return 20;
    return 0;
  }

  /**
   * Asigna score a la varianza
   */
  private scoreVariance(variance: number): number {
    if (variance > 10) return 100;
    if (variance > 7) return 70;
    if (variance > 5) return 50;
    if (variance > 3) return 30;
    return 10;
  }

  /**
   * Ajusta el score basado en contexto adicional
   */
  adjustScoreWithContext(
    baseScore: number,
    context: {
      timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
      hasCaregiver?: boolean;
      deviceQuality?: number;
      userAge?: number;
    }
  ): number {
    let adjustedScore = baseScore;

    // Ajuste por tiempo del día
    if (context.timeOfDay === 'night') {
      adjustedScore *= 1.2; // +20% riesgo de noche
    } else if (context.timeOfDay === 'morning') {
      adjustedScore *= 1.1; // +10% riesgo en la mañana
    }

    // Ajuste por presencia de cuidador
    if (context.hasCaregiver === true) {
      adjustedScore *= 0.8; // -20% riesgo con cuidador
    }

    // Ajuste por calidad del dispositivo
    if (context.deviceQuality !== undefined) {
      if (context.deviceQuality < 0.5) {
        adjustedScore *= 0.9; // Reducir confianza con mala calidad
      }
    }

    // Ajuste por edad del usuario
    if (context.userAge !== undefined) {
      if (context.userAge > 80) {
        adjustedScore *= 1.15; // +15% para edad avanzada
      } else if (context.userAge > 70) {
        adjustedScore *= 1.1; // +10%
      }
    }

    return Math.round(clamp(adjustedScore, 0, 100));
  }

  /**
   * Combina múltiples scores usando diferentes métodos
   */
  combineScores(
    scores: number[],
    method: 'average' | 'weighted' | 'max' | 'ensemble' = 'weighted'
  ): number {
    if (scores.length === 0) return 0;

    switch (method) {
      case 'average':
        return Math.round(mean(scores));

      case 'weighted':
        // Dar más peso a scores altos
        const weights = scores.map(s => s / 100);
        const weightedSum = scores.reduce((sum, score, i) => sum + score * weights[i], 0);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

      case 'max':
        // Usar el score más alto (enfoque conservador)
        return Math.max(...scores);

      case 'ensemble':
        // Combinación: 50% promedio + 30% máximo + 20% ponderado
        const avg = mean(scores);
        const max = Math.max(...scores);
        const weighted = this.combineScores(scores, 'weighted');
        return Math.round(avg * 0.5 + max * 0.3 + weighted * 0.2);

      default:
        return Math.round(mean(scores));
    }
  }

  /**
   * Calibra el score basado en tasa de falsas alarmas histórica
   */
  calibrateScore(
    score: number,
    falseAlarmRate: number
  ): { score: number; confidence: number } {
    let calibratedScore = score;
    let confidence = 1.0;

    // Si hay muchas falsas alarmas, reducir el score
    if (falseAlarmRate > 0.3) {
      calibratedScore *= 0.7; // Reducir 30%
      confidence *= 0.7;
    } else if (falseAlarmRate > 0.2) {
      calibratedScore *= 0.85; // Reducir 15%
      confidence *= 0.85;
    }

    // Si hay muy pocas falsas alarmas, aumentar confianza
    if (falseAlarmRate < 0.1) {
      confidence = Math.min(1, confidence * 1.2);
    }

    return {
      score: Math.round(clamp(calibratedScore, 0, 100)),
      confidence: clamp(confidence, 0, 1),
    };
  }

  /**
   * Evalúa la urgencia basada en el score
   */
  evaluateUrgency(score: number): {
    level: 'none' | 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timeToRespond: number; // minutos
  } {
    if (score >= 90) {
      return {
        level: 'critical',
        message: 'Immediate action required',
        timeToRespond: 2,
      };
    } else if (score >= 75) {
      return {
        level: 'high',
        message: 'Urgent attention needed',
        timeToRespond: 10,
      };
    } else if (score >= 50) {
      return {
        level: 'medium',
        message: 'Monitor closely',
        timeToRespond: 30,
      };
    } else if (score >= 30) {
      return {
        level: 'low',
        message: 'Regular monitoring sufficient',
        timeToRespond: 120,
      };
    } else {
      return {
        level: 'none',
        message: 'No immediate concerns',
        timeToRespond: 360,
      };
    }
  }

  /**
   * Genera explicación del score
   */
  explainScore(
    score: number,
    features: Partial<ExtractedFeatures>,
    prediction?: RiskPrediction
  ): string[] {
    const explanations: string[] = [];

    explanations.push(`Overall risk score: ${score}/100`);

    // Explicar factores principales
    if (features.fallCount24h && features.fallCount24h > 0) {
      explanations.push(`→ ${features.fallCount24h} falls in last 24 hours (+${features.fallCount24h * 10} points)`);
    }

    if (features.accelerationMagnitude && features.accelerationMagnitude > 15) {
      explanations.push(`→ High acceleration detected (${features.accelerationMagnitude.toFixed(1)} m/s²)`);
    }

    if (features.hourOfDay !== undefined) {
      if (features.hourOfDay >= 22 || features.hourOfDay < 6) {
        explanations.push(`→ Nighttime increases risk (+20 points)`);
      }
    }

    if (prediction && prediction.factors.length > 0) {
      const topFactor = prediction.factors[0];
      explanations.push(`→ Primary risk factor: ${topFactor.name}`);
    }

    return explanations;
  }
}

export const riskScorer = new RiskScorer();
