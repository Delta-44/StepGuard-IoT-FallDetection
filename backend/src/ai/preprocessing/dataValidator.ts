/**
 * Validador de datos
 * Verifica la integridad y calidad de los datos
 */

import { logger } from '../utils/logger';
import type { SensorData, HistoricalEvent } from '../types';

export class DataValidator {
  /**
   * Valida datos de un sensor
   */
  validateSensorData(data: SensorData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar deviceId
    if (!data.deviceId || data.deviceId.trim() === '') {
      errors.push('deviceId is required');
    }

    // Validar timestamp
    if (!data.timestamp || isNaN(data.timestamp.getTime())) {
      errors.push('Invalid timestamp');
    }

    // Validar valores de aceleración
    if (typeof data.acc_x !== 'number' || isNaN(data.acc_x)) {
      errors.push('acc_x must be a valid number');
    }
    if (typeof data.acc_y !== 'number' || isNaN(data.acc_y)) {
      errors.push('acc_y must be a valid number');
    }
    if (typeof data.acc_z !== 'number' || isNaN(data.acc_z)) {
      errors.push('acc_z must be a valid number');
    }

    // Validar rangos razonables (-50 a 50 m/s² es extremo pero posible)
    if (Math.abs(data.acc_x) > 50) {
      errors.push('acc_x value out of reasonable range');
    }
    if (Math.abs(data.acc_y) > 50) {
      errors.push('acc_y value out of reasonable range');
    }
    if (Math.abs(data.acc_z) > 50) {
      errors.push('acc_z value out of reasonable range');
    }

    // Validar timestamp no está en el futuro
    if (data.timestamp.getTime() > Date.now() + 60000) { // +1 min tolerancia
      errors.push('timestamp is in the future');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida un batch de datos de sensores
   */
  validateSensorBatch(dataList: SensorData[]): {
    valid: boolean;
    validCount: number;
    invalidCount: number;
    errors: string[];
  } {
    let validCount = 0;
    let invalidCount = 0;
    const allErrors: string[] = [];

    dataList.forEach((data, index) => {
      const result = this.validateSensorData(data);
      if (result.valid) {
        validCount++;
      } else {
        invalidCount++;
        allErrors.push(`Index ${index}: ${result.errors.join(', ')}`);
      }
    });

    return {
      valid: invalidCount === 0,
      validCount,
      invalidCount,
      errors: allErrors,
    };
  }

  /**
   * Valida evento histórico
   */
  validateHistoricalEvent(event: HistoricalEvent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar IDs
    if (!event.id || event.id <= 0) {
      errors.push('Invalid event id');
    }
    if (!event.dispositivo_id || event.dispositivo_id <= 0) {
      errors.push('Invalid dispositivo_id');
    }

    // Validar fecha
    if (!event.fecha_hora || isNaN(event.fecha_hora.getTime())) {
      errors.push('Invalid fecha_hora');
    }

    // Validar aceleraciones
    if (typeof event.acc_x !== 'number' || isNaN(event.acc_x)) {
      errors.push('acc_x must be a valid number');
    }
    if (typeof event.acc_y !== 'number' || isNaN(event.acc_y)) {
      errors.push('acc_y must be a valid number');
    }
    if (typeof event.acc_z !== 'number' || isNaN(event.acc_z)) {
      errors.push('acc_z must be a valid number');
    }

    // Validar severidad
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(event.severidad)) {
      errors.push(`Invalid severidad: ${event.severidad}`);
    }

    // Validar estado
    const validStates = ['pendiente', 'atendida', 'falsa_alarma', 'ignorada'];
    if (!validStates.includes(event.estado)) {
      errors.push(`Invalid estado: ${event.estado}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Verifica si los datos son suficientes para análisis
   */
  hasSufficientData(sensorHistory: SensorData[], minSamples: number = 10): boolean {
    return sensorHistory.length >= minSamples;
  }

  /**
   * Calcula un score de calidad de datos (0-1)
   */
  calculateDataQuality(
    sensorHistory: SensorData[],
    historicalEvents: HistoricalEvent[]
  ): number {
    let quality = 1.0;

    // Penalizar si hay pocos datos
    const totalSamples = sensorHistory.length + historicalEvents.length;
    if (totalSamples === 0) return 0;
    if (totalSamples < 10) quality *= 0.5;
    else if (totalSamples < 50) quality *= 0.7;
    else if (totalSamples < 100) quality *= 0.85;

    // Penalizar datos con muchos ceros
    const zerosInSensor = sensorHistory.filter(d => 
      d.acc_x === 0 && d.acc_y === 0 && d.acc_z === 0
    ).length;

    if (sensorHistory.length > 0) {
      const zeroRatio = zerosInSensor / sensorHistory.length;
      quality *= (1 - zeroRatio * 0.5);
    }

    // Penalizar si datos son muy antiguos
    if (sensorHistory.length > 0) {
      const latest = Math.max(...sensorHistory.map(d => d.timestamp.getTime()));
      const ageHours = (Date.now() - latest) / (1000 * 60 * 60);
      if (ageHours > 24) quality *= 0.8;
      if (ageHours > 72) quality *= 0.6;
    }

    // Bonus por diversidad de datos
    if (historicalEvents.length > 5) {
      const uniqueSeverities = new Set(historicalEvents.map(e => e.severidad)).size;
      const uniqueStates = new Set(historicalEvents.map(e => e.estado)).size;
      quality *= Math.min(1.1, 1 + (uniqueSeverities + uniqueStates) * 0.02);
    }

    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Detecta y reporta anomalías en los datos
   */
  detectDataAnomalies(data: SensorData[]): string[] {
    const anomalies: string[] = [];

    if (data.length === 0) {
      anomalies.push('No data available');
      return anomalies;
    }

    // Detectar valores constantes (sensor atascado)
    const uniqueValues = new Set(data.map(d => `${d.acc_x},${d.acc_y},${d.acc_z}`));
    if (uniqueValues.size === 1 && data.length > 10) {
      anomalies.push('Sensor readings are constant - possible sensor malfunction');
    }

    // Detectar gaps temporales
    const sortedData = [...data].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    for (let i = 1; i < sortedData.length; i++) {
      const timeDiff = sortedData[i].timestamp.getTime() - sortedData[i - 1].timestamp.getTime();
      if (timeDiff > 60 * 60 * 1000) { // > 1 hora
        anomalies.push(`Data gap detected: ${(timeDiff / (1000 * 60)).toFixed(1)} minutes`);
      }
    }

    // Detectar picos extremos (posible error)
    const magnitudes = data.map(d => 
      Math.sqrt(d.acc_x ** 2 + d.acc_y ** 2 + d.acc_z ** 2)
    );

    const extremePeaks = magnitudes.filter(m => m > 40).length;
    if (extremePeaks > data.length * 0.1) {
      anomalies.push('High number of extreme acceleration peaks - check sensor calibration');
    }

    return anomalies;
  }

  /**
   * Sanitiza datos eliminando valores inválidos
   */
  sanitizeData(data: SensorData[]): SensorData[] {
    return data.filter(d => {
      const validation = this.validateSensorData(d);
      return validation.valid;
    });
  }
}

export const dataValidator = new DataValidator();
