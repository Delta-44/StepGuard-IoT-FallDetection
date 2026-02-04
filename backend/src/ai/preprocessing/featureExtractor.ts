/**
 * Extractor de características (Feature Engineering)
 * Convierte datos crudos en características útiles para ML
 */

import { normalizer } from './normalizer';
import { mean, standardDeviation, variance, magnitude3D } from '../utils/mathUtils';
import { logger } from '../utils/logger';
import { TIME_SLOTS } from '../config';
import type { SensorData, HistoricalEvent, ExtractedFeatures } from '../types';

export class FeatureExtractor {
  /**
   * Extrae características de datos de sensores en tiempo real
   */
  extractFromSensorData(
    current: SensorData,
    history: SensorData[]
  ): Partial<ExtractedFeatures> {
    const magnitude = magnitude3D(current.acc_x, current.acc_y, current.acc_z);
    
    // Características temporales
    const temporal = normalizer.normalizeTemporalFeatures(current.timestamp);
    
    // Características del sensor actual
    const sensor = {
      accelerationMagnitude: magnitude,
      accelerationVariance: this.calculateVariance(history),
      maxAcceleration: this.getMaxMagnitude(history),
      minAcceleration: this.getMinMagnitude(history),
    };

    return {
      hourOfDay: temporal.hourOfDay,
      dayOfWeek: temporal.dayOfWeek,
      timeSlot: temporal.timeSlot,
      ...sensor,
    };
  }

  /**
   * Extrae características de eventos históricos
   */
  extractFromHistoricalEvents(
    events: HistoricalEvent[],
    windowHours: number = 24
  ): Partial<ExtractedFeatures> {
    if (events.length === 0) {
      return {
        fallCount24h: 0,
        fallCount7d: 0,
        avgTimeBetweenFalls: 0,
        falseAlarmRate: 0,
        activityLevel: 'low',
        movementFrequency: 0,
      };
    }

    // Contar caídas en diferentes ventanas temporales
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const fallCount24h = events.filter(e => e.fecha_hora >= last24h).length;
    const fallCount7d = events.filter(e => e.fecha_hora >= last7d).length;

    // Calcular tiempo promedio entre caídas
    const avgTimeBetweenFalls = this.calculateAvgTimeBetweenEvents(events);

    // Tasa de falsas alarmas
    const falseAlarms = events.filter(e => e.estado === 'falsa_alarma').length;
    const falseAlarmRate = events.length > 0 ? falseAlarms / events.length : 0;

    // Nivel de actividad basado en frecuencia de eventos
    const activityLevel = this.determineActivityLevel(events);

    // Frecuencia de movimiento (eventos por día)
    const timeSpan = 
      (events[0].fecha_hora.getTime() - events[events.length - 1].fecha_hora.getTime()) /
      (1000 * 60 * 60 * 24);
    const movementFrequency = events.length / Math.max(1, timeSpan);

    return {
      fallCount24h,
      fallCount7d,
      avgTimeBetweenFalls,
      falseAlarmRate,
      activityLevel,
      movementFrequency,
    };
  }

  /**
   * Extrae características completas combinando múltiples fuentes
   */
  extractComplete(
    currentSensor: SensorData,
    sensorHistory: SensorData[],
    historicalEvents: HistoricalEvent[]
  ): ExtractedFeatures {
    const sensorFeatures = this.extractFromSensorData(currentSensor, sensorHistory);
    const historicalFeatures = this.extractFromHistoricalEvents(historicalEvents);

    return {
      ...sensorFeatures,
      ...historicalFeatures,
    } as ExtractedFeatures;
  }

  /**
   * Convierte características a array numérico para ML
   */
  featuresToVector(features: Partial<ExtractedFeatures>): number[] {
    const activityMap = { low: 0.33, medium: 0.66, high: 1.0 };
    const timeSlotMap = { morning: 0.25, afternoon: 0.5, evening: 0.75, night: 1.0 };

    return [
      // Temporales (0-1)
      (features.hourOfDay || 0) / 23,
      (features.dayOfWeek || 0) / 6,
      timeSlotMap[features.timeSlot || 'morning'],
      
      // Sensor (normalizado)
      Math.min(1, (features.accelerationMagnitude || 0) / 30),
      Math.min(1, (features.accelerationVariance || 0) / 10),
      Math.min(1, (features.maxAcceleration || 0) / 30),
      
      // Histórico (normalizado)
      Math.min(1, (features.fallCount24h || 0) / 10),
      Math.min(1, (features.fallCount7d || 0) / 20),
      Math.min(1, (features.avgTimeBetweenFalls || 0) / (24 * 60)), // minutos -> días
      features.falseAlarmRate || 0,
      
      // Actividad
      activityMap[features.activityLevel || 'low'],
      Math.min(1, (features.movementFrequency || 0) / 5),
    ];
  }

  /**
   * Calcula varianza de magnitudes de aceleración
   */
  private calculateVariance(history: SensorData[]): number {
    if (history.length === 0) return 0;

    const magnitudes = history.map(d => magnitude3D(d.acc_x, d.acc_y, d.acc_z));
    return variance(magnitudes);
  }

  /**
   * Obtiene la magnitud máxima en el historial
   */
  private getMaxMagnitude(history: SensorData[]): number {
    if (history.length === 0) return 0;

    const magnitudes = history.map(d => magnitude3D(d.acc_x, d.acc_y, d.acc_z));
    return Math.max(...magnitudes);
  }

  /**
   * Obtiene la magnitud mínima en el historial
   */
  private getMinMagnitude(history: SensorData[]): number {
    if (history.length === 0) return 0;

    const magnitudes = history.map(d => magnitude3D(d.acc_x, d.acc_y, d.acc_z));
    return Math.min(...magnitudes);
  }

  /**
   * Calcula tiempo promedio entre eventos (en minutos)
   */
  private calculateAvgTimeBetweenEvents(events: HistoricalEvent[]): number {
    if (events.length < 2) return 0;

    // Ordenar eventos por fecha
    const sorted = [...events].sort((a, b) => 
      a.fecha_hora.getTime() - b.fecha_hora.getTime()
    );

    let totalTime = 0;
    for (let i = 1; i < sorted.length; i++) {
      const diff = sorted[i].fecha_hora.getTime() - sorted[i - 1].fecha_hora.getTime();
      totalTime += diff;
    }

    return totalTime / (sorted.length - 1) / (1000 * 60); // convertir a minutos
  }

  /**
   * Determina el nivel de actividad basado en eventos
   */
  private determineActivityLevel(
    events: HistoricalEvent[]
  ): 'low' | 'medium' | 'high' {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEvents = events.filter(e => e.fecha_hora >= last24h);

    if (recentEvents.length === 0) return 'low';
    if (recentEvents.length < 3) return 'low';
    if (recentEvents.length < 7) return 'medium';
    return 'high';
  }

  /**
   * Extrae características estadísticas avanzadas
   */
  extractStatisticalFeatures(magnitudes: number[]): any {
    if (magnitudes.length === 0) {
      return {
        mean: 0,
        std: 0,
        variance: 0,
        min: 0,
        max: 0,
        range: 0,
        skewness: 0,
        kurtosis: 0,
      };
    }

    const meanVal = mean(magnitudes);
    const stdVal = standardDeviation(magnitudes);
    const varianceVal = variance(magnitudes);
    const minVal = Math.min(...magnitudes);
    const maxVal = Math.max(...magnitudes);

    // Skewness (asimetría)
    const skewness = this.calculateSkewness(magnitudes, meanVal, stdVal);

    // Kurtosis (curtosis)
    const kurtosis = this.calculateKurtosis(magnitudes, meanVal, stdVal);

    return {
      mean: meanVal,
      std: stdVal,
      variance: varianceVal,
      min: minVal,
      max: maxVal,
      range: maxVal - minVal,
      skewness,
      kurtosis,
    };
  }

  /**
   * Calcula skewness (asimetría)
   */
  private calculateSkewness(values: number[], mean: number, std: number): number {
    if (std === 0 || values.length === 0) return 0;

    const n = values.length;
    const sum = values.reduce((acc, val) => 
      acc + Math.pow((val - mean) / std, 3), 0
    );

    return (n / ((n - 1) * (n - 2))) * sum;
  }

  /**
   * Calcula kurtosis (curtosis)
   */
  private calculateKurtosis(values: number[], mean: number, std: number): number {
    if (std === 0 || values.length === 0) return 0;

    const n = values.length;
    const sum = values.reduce((acc, val) => 
      acc + Math.pow((val - mean) / std, 4), 0
    );

    return (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * sum - 
           (3 * Math.pow(n - 1, 2) / ((n - 2) * (n - 3)));
  }
}

export const featureExtractor = new FeatureExtractor();
