/**
 * Normalizador de datos
 * Transforma datos crudos a formatos normalizados
 */

import { normalize, normalizeArray, standardize } from '../utils/mathUtils';
import { logger } from '../utils/logger';
import { THRESHOLDS } from '../config';
import type { SensorData } from '../types';

export class Normalizer {
  /**
   * Normaliza datos de un sensor individual
   */
  normalizeSensorData(data: SensorData): any {
    const magnitude = Math.sqrt(
      data.acc_x ** 2 + data.acc_y ** 2 + data.acc_z ** 2
    );

    return {
      deviceId: data.deviceId,
      timestamp: data.timestamp,
      
      // Valores originales
      raw: {
        acc_x: data.acc_x,
        acc_y: data.acc_y,
        acc_z: data.acc_z,
      },
      
      // Valores normalizados (0-1)
      normalized: {
        acc_x: normalize(data.acc_x, -30, 30), // Rango típico de acelerómetro
        acc_y: normalize(data.acc_y, -30, 30),
        acc_z: normalize(data.acc_z, -30, 30),
        magnitude: normalize(magnitude, 0, 40), // 0-40 m/s²
      },
      
      // Magnitud calculada
      magnitude,
      
      // Metadata
      isFallDetected: data.isFallDetected,
      temperature: data.temperature,
      humidity: data.humidity,
    };
  }

  /**
   * Normaliza un batch de datos de sensores
   */
  normalizeSensorBatch(dataList: SensorData[]): any[] {
    if (dataList.length === 0) return [];

    // Extraer todas las magnitudes para normalización adaptativa
    const magnitudes = dataList.map(d => 
      Math.sqrt(d.acc_x ** 2 + d.acc_y ** 2 + d.acc_z ** 2)
    );

    const minMag = Math.min(...magnitudes);
    const maxMag = Math.max(...magnitudes);

    return dataList.map((data, i) => ({
      deviceId: data.deviceId,
      timestamp: data.timestamp,
      
      raw: {
        acc_x: data.acc_x,
        acc_y: data.acc_y,
        acc_z: data.acc_z,
      },
      
      normalized: {
        acc_x: normalize(data.acc_x, -30, 30),
        acc_y: normalize(data.acc_y, -30, 30),
        acc_z: normalize(data.acc_z, -30, 30),
        magnitude: normalize(magnitudes[i], minMag, maxMag),
      },
      
      magnitude: magnitudes[i],
      isFallDetected: data.isFallDetected,
    }));
  }

  /**
   * Estandariza datos usando Z-score
   */
  standardizeData(values: number[]): number[] {
    return standardize(values);
  }

  /**
   * Normaliza características temporales
   */
  normalizeTemporalFeatures(date: Date): any {
    const hour = date.getHours();
    const dayOfWeek = date.getDay(); // 0 = Domingo
    const dayOfMonth = date.getDate();

    return {
      hour: normalize(hour, 0, 23),
      hourOfDay: hour,
      dayOfWeek,
      dayOfMonth,
      
      // Codificación cíclica para hora (mejor para ML)
      hourSin: Math.sin(2 * Math.PI * hour / 24),
      hourCos: Math.cos(2 * Math.PI * hour / 24),
      
      // Codificación cíclica para día de la semana
      daySin: Math.sin(2 * Math.PI * dayOfWeek / 7),
      dayCos: Math.cos(2 * Math.PI * dayOfWeek / 7),
      
      // Slot de tiempo
      timeSlot: this.getTimeSlot(hour),
      
      // Flags binarios
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0,
      isMorning: hour >= 6 && hour < 12 ? 1 : 0,
      isAfternoon: hour >= 12 && hour < 18 ? 1 : 0,
      isEvening: hour >= 18 && hour < 22 ? 1 : 0,
      isNight: hour >= 22 || hour < 6 ? 1 : 0,
    };
  }

  /**
   * Determina el slot de tiempo del día
   */
  private getTimeSlot(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Normaliza severidad de caídas
   */
  normalizeSeverity(severity: 'low' | 'medium' | 'high' | 'critical'): number {
    const severityMap = {
      low: 0.25,
      medium: 0.5,
      high: 0.75,
      critical: 1.0,
    };
    return severityMap[severity] || 0;
  }

  /**
   * Normaliza estado de eventos
   */
  normalizeEventState(state: 'pendiente' | 'atendida' | 'falsa_alarma' | 'ignorada'): any {
    return {
      isPending: state === 'pendiente' ? 1 : 0,
      isAttended: state === 'atendida' ? 1 : 0,
      isFalseAlarm: state === 'falsa_alarma' ? 1 : 0,
      isIgnored: state === 'ignorada' ? 1 : 0,
    };
  }

  /**
   * Limpia outliers extremos
   */
  cleanOutliers(values: number[], threshold: number = 3): number[] {
    if (values.length === 0) return [];

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );

    return values.map(value => {
      const zScore = Math.abs((value - mean) / std);
      // Si es outlier extremo, reemplazar por la mediana
      if (zScore > threshold) {
        return mean;
      }
      return value;
    });
  }

  /**
   * Normaliza array de valores a rango [0,1]
   */
  normalizeToRange(values: number[], min?: number, max?: number): number[] {
    if (values.length === 0) return [];

    const actualMin = min !== undefined ? min : Math.min(...values);
    const actualMax = max !== undefined ? max : Math.max(...values);

    if (actualMin === actualMax) {
      return values.map(() => 0.5);
    }

    return values.map(v => (v - actualMin) / (actualMax - actualMin));
  }

  /**
   * Rellena valores faltantes con interpolación lineal
   */
  fillMissingValues(values: (number | null)[]): number[] {
    const result: number[] = [];
    
    for (let i = 0; i < values.length; i++) {
      if (values[i] !== null) {
        result.push(values[i]!);
      } else {
        // Buscar valores no-nulos antes y después
        let before: number | null = null;
        let after: number | null = null;
        
        for (let j = i - 1; j >= 0; j--) {
          if (values[j] !== null) {
            before = values[j]!;
            break;
          }
        }
        
        for (let j = i + 1; j < values.length; j++) {
          if (values[j] !== null) {
            after = values[j]!;
            break;
          }
        }
        
        // Interpolar
        if (before !== null && after !== null) {
          result.push((before + after) / 2);
        } else if (before !== null) {
          result.push(before);
        } else if (after !== null) {
          result.push(after);
        } else {
          result.push(0); // Fallback
        }
      }
    }
    
    return result;
  }
}

export const normalizer = new Normalizer();
