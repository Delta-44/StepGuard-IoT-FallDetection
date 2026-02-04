/**
 * Configuración del sistema de IA
 */

import { AIConfig } from './types';

export const AI_CONFIG: AIConfig = {
  models: {
    anomalyDetection: {
      enabled: true,
      threshold: 3.0, // Z-score threshold
      sensitivity: 'medium', // low = 3.5, medium = 3.0, high = 2.5
    },
    riskPrediction: {
      enabled: true,
      updateInterval: 30000, // 30 segundos
      lookbackWindow: 24, // 24 horas
    },
    patternAnalysis: {
      enabled: true,
      minPatternFrequency: 3, // Mínimo 3 ocurrencias
      minConfidence: 0.7, // 70% confianza mínima
    },
  },
  
  cache: {
    enabled: true,
    ttl: 300, // 5 minutos
    maxSize: 50, // 50 MB
  },
  
  alerts: {
    enabled: true,
    thresholds: {
      low: 30,
      medium: 60,
      high: 80,
      critical: 90,
    },
  },
};

// ============================================================================
// CONFIGURACIÓN DE MODELOS DE IA
// ============================================================================

export const NEURAL_NETWORK_CONFIG = {
  // Configuración optimizada para 512 MB RAM (free tier)
  hiddenLayers: [8], // Solo 8 neuronas (muy ligero)
  activation: 'sigmoid' as const,
  learningRate: 0.3,
  iterations: 2000,
  errorThresh: 0.005,
  log: false,
  logPeriod: 100,
  timeout: 30000, // 30 segundos máximo
};

// ============================================================================
// PESOS DE CARACTERÍSTICAS
// ============================================================================

export const FEATURE_WEIGHTS = {
  temporal: {
    hourOfDay: 0.15,
    dayOfWeek: 0.05,
    timeSlot: 0.10,
  },
  sensor: {
    accelerationMagnitude: 0.25,
    accelerationVariance: 0.20,
    maxAcceleration: 0.15,
  },
  historical: {
    fallCount24h: 0.20,
    fallCount7d: 0.15,
    falseAlarmRate: -0.10, // Negativo = reduce el riesgo
  },
  activity: {
    activityLevel: 0.10,
    movementFrequency: 0.05,
  },
};

// ============================================================================
// UMBRALES Y LÍMITES
// ============================================================================

export const THRESHOLDS = {
  // Umbrales de aceleración
  acceleration: {
    normal: 10, // m/s²
    moderate: 15,
    high: 20,
    critical: 25,
  },
  
  // Umbrales de varianza
  variance: {
    stable: 2,
    moderate: 5,
    high: 10,
  },
  
  // Z-score para anomalías
  zScore: {
    low: 2.5,
    medium: 3.0,
    high: 3.5,
  },
  
  // Frecuencia de caídas (por período)
  fallFrequency: {
    normal: 1, // por semana
    concerning: 2,
    critical: 4,
  },
};

// ============================================================================
// VENTANAS TEMPORALES
// ============================================================================

export const TIME_WINDOWS = {
  realTime: 60, // 1 minuto
  shortTerm: 300, // 5 minutos
  mediumTerm: 3600, // 1 hora
  longTerm: 86400, // 24 horas
  historical: 604800, // 7 días
};

// ============================================================================
// SLOTS DE TIEMPO
// ============================================================================

export const TIME_SLOTS = {
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 18 },
  evening: { start: 18, end: 22 },
  night: { start: 22, end: 6 },
};

// ============================================================================
// MENSAJES Y PLANTILLAS
// ============================================================================

export const ALERT_MESSAGES = {
  fall_detected: {
    low: 'Posible movimiento inusual detectado',
    medium: 'Caída potencial detectada',
    high: 'Caída detectada - Revisar al usuario',
    critical: '¡CAÍDA CRÍTICA! - Atención inmediata requerida',
  },
  high_risk: {
    low: 'Riesgo de caída ligeramente elevado',
    medium: 'Riesgo moderado de caída detectado',
    high: 'Alto riesgo de caída - Supervisión recomendada',
    critical: 'Riesgo crítico de caída - Acción preventiva urgente',
  },
  anomaly: {
    low: 'Patrón de actividad inusual',
    medium: 'Anomalía en el comportamiento detectada',
    high: 'Anomalía significativa - Investigar causa',
    critical: 'Anomalía crítica en los datos del sensor',
  },
  pattern_change: {
    low: 'Cambio menor en los patrones de actividad',
    medium: 'Cambio en los patrones habituales',
    high: 'Cambio significativo en el comportamiento',
    critical: 'Cambio drástico en patrones - Revisar urgente',
  },
};

// ============================================================================
// CONFIGURACIÓN DE LOGGING
// ============================================================================

export const LOG_CONFIG = {
  enabled: process.env.NODE_ENV !== 'production',
  level: process.env.LOG_LEVEL || 'info',
  prefix: '[AI Engine]',
  colors: {
    info: '\x1b[36m', // Cyan
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    success: '\x1b[32m', // Green
    reset: '\x1b[0m',
  },
};

// ============================================================================
// VERSIÓN DEL MODELO
// ============================================================================

export const MODEL_VERSION = '1.0.0';

export const MODEL_METADATA = {
  version: MODEL_VERSION,
  createdAt: new Date('2026-02-04'),
  description: 'Sistema de IA para detección de caídas y predicción de riesgo',
  author: 'StepGuard Team',
  minimumRAM: 512, // MB
  optimizedFor: 'free-tier deployment',
};
