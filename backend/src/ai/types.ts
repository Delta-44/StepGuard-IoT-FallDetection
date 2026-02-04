/**
 * Tipos e interfaces para el sistema de IA
 */

// ============================================================================
// DATOS DE ENTRADA
// ============================================================================

export interface SensorData {
  deviceId: string;
  timestamp: Date;
  acc_x: number;
  acc_y: number;
  acc_z: number;
  isFallDetected?: boolean;
  temperature?: number;
  humidity?: number;
}

export interface HistoricalEvent {
  id: number;
  dispositivo_id: number;
  usuario_id?: number;
  fecha_hora: Date;
  fecha_atencion?: Date | null;
  acc_x: number;
  acc_y: number;
  acc_z: number;
  severidad: 'low' | 'medium' | 'high' | 'critical';
  estado: 'pendiente' | 'atendida' | 'falsa_alarma' | 'ignorada';
}

// ============================================================================
// CARACTERÍSTICAS EXTRAÍDAS
// ============================================================================

export interface ExtractedFeatures {
  // Características temporales
  hourOfDay: number;
  dayOfWeek: number;
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
  
  // Características del sensor
  accelerationMagnitude: number;
  accelerationVariance: number;
  maxAcceleration: number;
  minAcceleration: number;
  
  // Características del historial
  fallCount24h: number;
  fallCount7d: number;
  avgTimeBetweenFalls: number;
  falseAlarmRate: number;
  
  // Patrones de actividad
  activityLevel: 'low' | 'medium' | 'high';
  movementFrequency: number;
}

// ============================================================================
// RESULTADOS DE ANÁLISIS
// ============================================================================

export interface AnomalyResult {
  isAnomaly: boolean;
  anomalyScore: number;
  zScore: number;
  threshold: number;
  confidence: number;
  reason?: string;
}

export interface RiskPrediction {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  probability: number; // 0-1
  confidence: number; // 0-1
  factors: RiskFactor[];
  nextCheckTime?: Date;
}

export interface RiskFactor {
  name: string;
  value: number;
  weight: number;
  impact: 'positive' | 'negative';
  description: string;
}

export interface PatternAnalysis {
  patterns: Pattern[];
  trends: Trend[];
  insights: string[];
}

export interface Pattern {
  type: 'temporal' | 'behavioral' | 'environmental';
  description: string;
  frequency: number;
  confidence: number;
  startDate: Date;
  endDate?: Date;
}

export interface Trend {
  metric: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  rate: number;
  significance: number;
}

// ============================================================================
// ALERTAS Y NOTIFICACIONES
// ============================================================================

export interface Alert {
  id?: string;
  userId: number;
  deviceId: string;
  type: 'fall_detected' | 'high_risk' | 'anomaly' | 'pattern_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  data?: any;
  actionRequired: boolean;
  recommendations: string[];
}

export interface Recommendation {
  id: string;
  category: 'safety' | 'health' | 'device' | 'routine';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actions: string[];
  confidence: number;
}

// ============================================================================
// CONFIGURACIÓN DE IA
// ============================================================================

export interface AIConfig {
  // Configuración de modelos
  models: {
    anomalyDetection: {
      enabled: boolean;
      threshold: number;
      sensitivity: 'low' | 'medium' | 'high';
    };
    riskPrediction: {
      enabled: boolean;
      updateInterval: number; // milisegundos
      lookbackWindow: number; // horas
    };
    patternAnalysis: {
      enabled: boolean;
      minPatternFrequency: number;
      minConfidence: number;
    };
  };
  
  // Configuración de cache
  cache: {
    enabled: boolean;
    ttl: number; // segundos
    maxSize: number; // MB
  };
  
  // Configuración de alertas
  alerts: {
    enabled: boolean;
    thresholds: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
}

// ============================================================================
// ANÁLISIS COMPLETO
// ============================================================================

export interface ComprehensiveAnalysis {
  userId: number;
  deviceId: string;
  timestamp: Date;
  
  currentState: {
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    isAnomalous: boolean;
  };
  
  predictions: RiskPrediction;
  anomalies: AnomalyResult;
  patterns: PatternAnalysis;
  recommendations: Recommendation[];
  alerts: Alert[];
  
  metadata: {
    analysisVersion: string;
    processingTime: number; // ms
    dataQuality: number; // 0-1
    confidence: number; // 0-1
  };
}

// ============================================================================
// DATOS AGREGADOS
// ============================================================================

export interface AggregatedData {
  deviceId: string;
  timeWindow: {
    start: Date;
    end: Date;
    duration: number; // minutos
  };
  
  sensorStats: {
    avgAccX: number;
    avgAccY: number;
    avgAccZ: number;
    maxMagnitude: number;
    variance: number;
    sampleCount: number;
  };
  
  eventStats: {
    totalFalls: number;
    confirmedFalls: number;
    falseAlarms: number;
    avgSeverity: number;
  };
  
  userStats?: {
    userId: number;
    totalEvents: number;
    responseTime: number; // segundos
    caregiverEngagement: number;
  };
}

// ============================================================================
// TRAINING DATA
// ============================================================================

export interface TrainingData {
  inputs: number[][];
  outputs: number[][];
  metadata: {
    sampleCount: number;
    featureCount: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    dataQuality: number;
  };
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  trainingTime: number; // ms
  sampleSize: number;
}
