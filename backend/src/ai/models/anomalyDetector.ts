/**
 * Detector de Anomalías
 * Utiliza métodos estadísticos para detectar comportamientos anómalos
 */

import { zScore, mean, standardDeviation, isOutlier } from '../utils/mathUtils';
import { logger } from '../utils/logger';
import { AI_CONFIG, THRESHOLDS } from '../config';
import type { AnomalyResult, SensorData } from '../types';

export class AnomalyDetector {
  private sensitivityThresholds = {
    low: 3.5,
    medium: 3.0,
    high: 2.5,
  };

  /**
   * Detecta anomalías en un valor específico comparado con el historial
   */
  detect(
    currentValue: number,
    historicalValues: number[],
    threshold?: number
  ): AnomalyResult {
    if (historicalValues.length < 3) {
      return {
        isAnomaly: false,
        anomalyScore: 0,
        zScore: 0,
        threshold: threshold || this.getCurrentThreshold(),
        confidence: 0,
        reason: 'Insufficient historical data',
      };
    }

    const zScoreValue = zScore(currentValue, historicalValues);
    const currentThreshold = threshold || this.getCurrentThreshold();
    const isAnomaly = Math.abs(zScoreValue) > currentThreshold;

    // Calcular score de anomalía (0-1)
    const anomalyScore = Math.min(1, Math.abs(zScoreValue) / (currentThreshold * 2));

    // Calcular confianza basada en cantidad de datos
    const confidence = Math.min(1, historicalValues.length / 50);

    return {
      isAnomaly,
      anomalyScore,
      zScore: zScoreValue,
      threshold: currentThreshold,
      confidence,
      reason: isAnomaly
        ? `Value deviates ${Math.abs(zScoreValue).toFixed(2)} standard deviations from mean`
        : undefined,
    };
  }

  /**
   * Detecta anomalías en datos de sensores
   */
  detectInSensorData(
    current: SensorData,
    history: SensorData[]
  ): AnomalyResult {
    if (history.length < 3) {
      return {
        isAnomaly: false,
        anomalyScore: 0,
        zScore: 0,
        threshold: this.getCurrentThreshold(),
        confidence: 0,
        reason: 'Insufficient sensor history',
      };
    }

    // Calcular magnitud actual
    const currentMagnitude = Math.sqrt(
      current.acc_x ** 2 + current.acc_y ** 2 + current.acc_z ** 2
    );

    // Calcular magnitudes históricas
    const historicalMagnitudes = history.map(d =>
      Math.sqrt(d.acc_x ** 2 + d.acc_y ** 2 + d.acc_z ** 2)
    );

    return this.detect(currentMagnitude, historicalMagnitudes);
  }

  /**
   * Detecta anomalías usando el método IQR (Interquartile Range)
   */
  detectUsingIQR(currentValue: number, historicalValues: number[]): AnomalyResult {
    if (historicalValues.length < 4) {
      return {
        isAnomaly: false,
        anomalyScore: 0,
        zScore: 0,
        threshold: 1.5,
        confidence: 0,
        reason: 'Insufficient data for IQR method',
      };
    }

    const sorted = [...historicalValues].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const isAnomaly = currentValue < lowerBound || currentValue > upperBound;

    // Calcular cuánto se desvía de los límites
    let deviation = 0;
    if (currentValue < lowerBound) {
      deviation = (lowerBound - currentValue) / iqr;
    } else if (currentValue > upperBound) {
      deviation = (currentValue - upperBound) / iqr;
    }

    const anomalyScore = Math.min(1, deviation / 3);

    return {
      isAnomaly,
      anomalyScore,
      zScore: deviation,
      threshold: 1.5,
      confidence: Math.min(1, historicalValues.length / 30),
      reason: isAnomaly
        ? `Value outside IQR bounds [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]`
        : undefined,
    };
  }

  /**
   * Detecta anomalías en patrones temporales
   */
  detectTemporalAnomaly(
    currentHour: number,
    historicalEventsByHour: Map<number, number>
  ): AnomalyResult {
    // Obtener frecuencia de eventos por hora
    const frequencies = Array.from(historicalEventsByHour.values());
    const currentFrequency = historicalEventsByHour.get(currentHour) || 0;

    if (frequencies.length < 3) {
      return {
        isAnomaly: false,
        anomalyScore: 0,
        zScore: 0,
        threshold: this.getCurrentThreshold(),
        confidence: 0,
      };
    }

    const avgFrequency = mean(frequencies);
    const std = standardDeviation(frequencies);

    if (std === 0) {
      return {
        isAnomaly: false,
        anomalyScore: 0,
        zScore: 0,
        threshold: this.getCurrentThreshold(),
        confidence: 0.5,
      };
    }

    const zScoreValue = (currentFrequency - avgFrequency) / std;
    const threshold = this.getCurrentThreshold();
    const isAnomaly = Math.abs(zScoreValue) > threshold;

    return {
      isAnomaly,
      anomalyScore: Math.min(1, Math.abs(zScoreValue) / (threshold * 2)),
      zScore: zScoreValue,
      threshold,
      confidence: Math.min(1, frequencies.length / 24),
      reason: isAnomaly
        ? `Unusual activity at hour ${currentHour}:00`
        : undefined,
    };
  }

  /**
   * Detecta cambios bruscos en tendencias (Concept Drift)
   */
  detectConceptDrift(recentValues: number[], olderValues: number[]): AnomalyResult {
    if (recentValues.length < 5 || olderValues.length < 5) {
      return {
        isAnomaly: false,
        anomalyScore: 0,
        zScore: 0,
        threshold: 2.0,
        confidence: 0,
        reason: 'Insufficient data for drift detection',
      };
    }

    const recentMean = mean(recentValues);
    const olderMean = mean(olderValues);
    const recentStd = standardDeviation(recentValues);
    const olderStd = standardDeviation(olderValues);

    // Calcular diferencia normalizada entre medias
    const pooledStd = Math.sqrt((recentStd ** 2 + olderStd ** 2) / 2);
    const meanDifference = Math.abs(recentMean - olderMean);
    const normalizedDiff = pooledStd > 0 ? meanDifference / pooledStd : 0;

    const threshold = 2.0;
    const isAnomaly = normalizedDiff > threshold;

    return {
      isAnomaly,
      anomalyScore: Math.min(1, normalizedDiff / (threshold * 2)),
      zScore: normalizedDiff,
      threshold,
      confidence: Math.min(1, (recentValues.length + olderValues.length) / 50),
      reason: isAnomaly
        ? `Significant shift in behavior detected (${normalizedDiff.toFixed(2)} std)`
        : undefined,
    };
  }

  /**
   * Detecta anomalías multivariadas (considerando múltiples características)
   */
  detectMultivariate(
    currentFeatures: number[],
    historicalFeatures: number[][]
  ): AnomalyResult {
    if (historicalFeatures.length < 10) {
      return {
        isAnomaly: false,
        anomalyScore: 0,
        zScore: 0,
        threshold: this.getCurrentThreshold(),
        confidence: 0,
        reason: 'Insufficient multivariate data',
      };
    }

    // Calcular distancia euclidiana promedio al historial
    const distances = historicalFeatures.map(historical => {
      return Math.sqrt(
        currentFeatures.reduce((sum, val, i) => {
          return sum + Math.pow(val - historical[i], 2);
        }, 0)
      );
    });

    const avgDistance = mean(distances);
    const stdDistance = standardDeviation(distances);

    // Calcular distancia actual normalizada
    const normalizedDistance = stdDistance > 0 ? avgDistance / stdDistance : 0;

    const threshold = this.getCurrentThreshold();
    const isAnomaly = normalizedDistance > threshold;

    return {
      isAnomaly,
      anomalyScore: Math.min(1, normalizedDistance / (threshold * 2)),
      zScore: normalizedDistance,
      threshold,
      confidence: Math.min(1, historicalFeatures.length / 50),
      reason: isAnomaly
        ? `Feature vector deviates significantly from historical patterns`
        : undefined,
    };
  }

  /**
   * Combina múltiples métodos de detección (ensemble)
   */
  detectEnsemble(
    currentValue: number,
    historicalValues: number[]
  ): AnomalyResult {
    const zScoreResult = this.detect(currentValue, historicalValues);
    const iqrResult = this.detectUsingIQR(currentValue, historicalValues);

    // Votación: ambos métodos deben estar de acuerdo
    const isAnomaly = zScoreResult.isAnomaly && iqrResult.isAnomaly;

    // Promedio ponderado de scores
    const anomalyScore = (zScoreResult.anomalyScore * 0.6 + iqrResult.anomalyScore * 0.4);

    // Máxima confianza de ambos
    const confidence = Math.max(zScoreResult.confidence, iqrResult.confidence);

    return {
      isAnomaly,
      anomalyScore,
      zScore: zScoreResult.zScore,
      threshold: zScoreResult.threshold,
      confidence,
      reason: isAnomaly
        ? `Both Z-Score and IQR methods detected anomaly`
        : undefined,
    };
  }

  /**
   * Obtiene el umbral actual según la configuración
   */
  private getCurrentThreshold(): number {
    const sensitivity = AI_CONFIG.models.anomalyDetection.sensitivity;
    return this.sensitivityThresholds[sensitivity];
  }

  /**
   * Ajusta la sensibilidad dinámicamente basado en tasa de falsas alarmas
   */
  adjustSensitivity(falseAlarmRate: number): void {
    if (falseAlarmRate > 0.3) {
      // Muchas falsas alarmas, reducir sensibilidad
      AI_CONFIG.models.anomalyDetection.sensitivity = 'low';
      logger.info('Reduced anomaly detection sensitivity due to high false alarm rate');
    } else if (falseAlarmRate < 0.1) {
      // Pocas falsas alarmas, aumentar sensibilidad
      AI_CONFIG.models.anomalyDetection.sensitivity = 'high';
      logger.info('Increased anomaly detection sensitivity due to low false alarm rate');
    }
  }

  /**
   * Genera reporte de anomalías detectadas
   */
  generateReport(results: AnomalyResult[]): any {
    const anomalies = results.filter(r => r.isAnomaly);
    const totalChecks = results.length;
    const anomalyRate = totalChecks > 0 ? anomalies.length / totalChecks : 0;

    return {
      totalChecks,
      anomaliesDetected: anomalies.length,
      anomalyRate,
      avgAnomalyScore: anomalies.length > 0
        ? mean(anomalies.map(a => a.anomalyScore))
        : 0,
      avgConfidence: results.length > 0
        ? mean(results.map(r => r.confidence))
        : 0,
      severityDistribution: {
        low: anomalies.filter(a => a.anomalyScore < 0.33).length,
        medium: anomalies.filter(a => a.anomalyScore >= 0.33 && a.anomalyScore < 0.66).length,
        high: anomalies.filter(a => a.anomalyScore >= 0.66).length,
      },
    };
  }
}

export const anomalyDetector = new AnomalyDetector();
