/**
 * Utilidades matemáticas para el sistema de IA
 * Implementación ligera sin dependencias externas
 */

// ============================================================================
// ESTADÍSTICAS BÁSICAS
// ============================================================================

/**
 * Calcula la media de un array de números
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calcula la mediana de un array de números
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calcula la desviación estándar
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = mean(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

/**
 * Calcula la varianza
 */
export function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
}

/**
 * Calcula el Z-Score de un valor
 */
export function zScore(value: number, values: number[]): number {
  const avg = mean(values);
  const std = standardDeviation(values);
  if (std === 0) return 0;
  return (value - avg) / std;
}

// ============================================================================
// NORMALIZACIÓN
// ============================================================================

/**
 * Normaliza un valor entre 0 y 1
 */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Normaliza un array de valores
 */
export function normalizeArray(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return values.map(v => normalize(v, min, max));
}

/**
 * Estandarización Z-score de un array
 */
export function standardize(values: number[]): number[] {
  const avg = mean(values);
  const std = standardDeviation(values);
  if (std === 0) return values.map(() => 0);
  return values.map(v => (v - avg) / std);
}

// ============================================================================
// VECTORES Y MAGNITUDES
// ============================================================================

/**
 * Calcula la magnitud de un vector 3D
 */
export function magnitude3D(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Calcula la distancia euclidiana entre dos puntos
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Arrays must have same length');
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
  );
}

/**
 * Producto punto de dos vectores
 */
export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Arrays must have same length');
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

// ============================================================================
// SUAVIZADO Y FILTROS
// ============================================================================

/**
 * Media móvil simple (SMA)
 */
export function movingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    result.push(mean(slice));
  }
  return result;
}

/**
 * Media móvil exponencial (EMA)
 */
export function exponentialMovingAverage(
  values: number[],
  alpha: number = 0.3
): number[] {
  if (values.length === 0) return [];
  const result: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(alpha * values[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

// ============================================================================
// CORRELACIÓN Y TENDENCIAS
// ============================================================================

/**
 * Calcula el coeficiente de correlación de Pearson
 */
export function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const meanX = mean(x);
  const meanY = mean(y);
  
  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denominatorX += diffX * diffX;
    denominatorY += diffY * diffY;
  }
  
  const denominator = Math.sqrt(denominatorX * denominatorY);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calcula la pendiente de una regresión lineal simple
 */
export function linearTrend(values: number[]): number {
  if (values.length < 2) return 0;
  
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;
  
  const meanX = mean(x);
  const meanY = mean(y);
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += Math.pow(x[i] - meanX, 2);
  }
  
  return denominator === 0 ? 0 : numerator / denominator;
}

// ============================================================================
// PERCENTILES Y CUARTILES
// ============================================================================

/**
 * Calcula un percentil específico
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  if (p < 0 || p > 100) throw new Error('Percentile must be between 0 and 100');
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (lower === upper) return sorted[lower];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calcula cuartiles (Q1, Q2, Q3)
 */
export function quartiles(values: number[]): { q1: number; q2: number; q3: number } {
  return {
    q1: percentile(values, 25),
    q2: percentile(values, 50),
    q3: percentile(values, 75),
  };
}

// ============================================================================
// OUTLIERS
// ============================================================================

/**
 * Detecta outliers usando el método IQR (Interquartile Range)
 */
export function detectOutliers(values: number[]): number[] {
  const { q1, q3 } = quartiles(values);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return values.filter(v => v < lowerBound || v > upperBound);
}

/**
 * Verifica si un valor es outlier
 */
export function isOutlier(value: number, values: number[]): boolean {
  const { q1, q3 } = quartiles(values);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return value < lowerBound || value > upperBound;
}

// ============================================================================
// UTILIDADES GENERALES
// ============================================================================

/**
 * Clamp: limita un valor entre min y max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Redondea a N decimales
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Interpola linealmente entre dos valores
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Mapea un valor de un rango a otro
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
