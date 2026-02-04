# Sistema de IA para Detección de Caídas

## 📋 Descripción General

Sistema de inteligencia artificial diseñado para analizar datos en tiempo real y históricos de dispositivos ESP32 para detectar patrones, anomalías y predecir riesgos de caídas.

## 🏗️ Arquitectura

```
ai/
├── index.ts                    # Motor principal de IA
├── aiService.ts                # Capa de servicio (API interna)
├── types.ts                    # Definiciones TypeScript
├── config.ts                   # Configuración y constantes
│
├── collectors/                 # Recolección de datos
│   ├── redisCollector.ts      # Datos en tiempo real (Redis)
│   ├── postgresCollector.ts   # Datos históricos (PostgreSQL)
│   └── dataAggregator.ts      # Agregación de datos
│
├── preprocessing/              # Preprocesamiento
│   ├── normalizer.ts          # Normalización de datos
│   ├── featureExtractor.ts    # Extracción de características
│   └── dataValidator.ts       # Validación de datos
│
├── models/                     # Modelos de IA
│   ├── anomalyDetector.ts     # Detección de anomalías
│   ├── riskPredictor.ts       # Predicción de riesgo
│   └── patternAnalyzer.ts     # Análisis de patrones
│
├── decision/                   # Motor de decisiones
│   ├── alertGenerator.ts      # Generación de alertas
│   ├── riskScorer.ts         # Cálculo de scores de riesgo
│   └── recommendationEngine.ts # Generación de recomendaciones
│
└── utils/                      # Utilidades
    ├── mathUtils.ts           # Funciones matemáticas
    └── logger.ts              # Logger personalizado
```

## 🚀 API Endpoints

### 1. Health Check
```http
GET /api/ai/health
```
Verifica el estado del sistema de IA.

**Response:**
```json
{
  "success": true,
  "ready": true,
  "status": {
    "initialized": true,
    "modelsLoaded": true,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Análisis Completo de Usuario
```http
GET /api/ai/analyze/:userId
```
Realiza un análisis exhaustivo de un usuario específico.

**Params:**
- `userId` (number): ID del usuario

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "timestamp": "2024-01-15T10:30:00Z",
    "riskScore": 0.75,
    "riskLevel": "high",
    "alerts": [
      {
        "type": "risk",
        "severity": "high",
        "message": "Alto riesgo de caída detectado",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ],
    "anomalies": [...],
    "patterns": {...},
    "recommendations": [...]
  }
}
```

### 3. Análisis de Riesgo de Dispositivo
```http
GET /api/ai/risk/:deviceId?deviceIdNum=123
```
Analiza el riesgo actual de un dispositivo ESP32.

**Params:**
- `deviceId` (string): ID del dispositivo (e.g., "ESP32_001")

**Query:**
- `deviceIdNum` (number, opcional): ID numérico del dispositivo

**Response:**
```json
{
  "success": true,
  "data": {
    "deviceId": "ESP32_001",
    "riskScore": 0.65,
    "riskLevel": "medium",
    "factors": {
      "anomalyScore": 0.7,
      "historicalScore": 0.6,
      "patternScore": 0.65
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 4. Detección de Anomalías
```http
GET /api/ai/anomalies/:deviceId?timeWindow=60
```
Detecta anomalías en los datos del dispositivo.

**Params:**
- `deviceId` (string): ID del dispositivo

**Query:**
- `timeWindow` (number, opcional): Ventana de tiempo en minutos (default: 60)

**Response:**
```json
{
  "success": true,
  "data": {
    "deviceId": "ESP32_001",
    "totalAnomalies": 5,
    "criticalAnomalies": 2,
    "anomalies": [
      {
        "type": "acceleration",
        "severity": "high",
        "value": 15.2,
        "threshold": 10.0,
        "timestamp": "2024-01-15T10:28:00Z",
        "description": "Aceleración anormalmente alta detectada"
      }
    ]
  }
}
```

### 5. Insights de Usuario
```http
GET /api/ai/insights/:userId
```
Obtiene insights y recomendaciones personalizadas.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "riskProfile": {
      "level": "medium",
      "score": 0.55,
      "trend": "increasing"
    },
    "patterns": {
      "activityLevel": "low",
      "riskTimes": ["08:00-10:00", "20:00-22:00"],
      "commonAnomalies": ["high_acceleration", "sudden_movement"]
    },
    "recommendations": [
      {
        "type": "safety",
        "priority": "high",
        "title": "Mejorar iluminación",
        "description": "Se detectan más incidentes durante las horas de la mañana temprano..."
      }
    ]
  }
}
```

### 6. Predicción de Caídas
```http
POST /api/ai/predict-fall
Content-Type: application/json

{
  "deviceId": "ESP32_001",
  "timeWindow": 24
}
```
Predice la probabilidad de caída en una ventana de tiempo.

**Response:**
```json
{
  "success": true,
  "data": {
    "deviceId": "ESP32_001",
    "prediction": {
      "probability": 0.72,
      "confidence": 0.85,
      "riskLevel": "high",
      "timeWindow": 24
    },
    "factors": {
      "recentAnomalies": 0.8,
      "historicalPattern": 0.65,
      "deviceCondition": 0.7
    },
    "preventiveMeasures": [...]
  }
}
```

### 7. Análisis por Lotes
```http
POST /api/ai/batch-analyze
Content-Type: application/json

{
  "userIds": [1, 2, 3, 4, 5]
}
```
Analiza múltiples usuarios simultáneamente.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": 1,
      "analysis": {...}
    },
    {
      "userId": 2,
      "analysis": {...}
    }
  ]
}
```

### 8. Estado del Sistema
```http
GET /api/ai/status
```
Obtiene información del estado del sistema de IA.

**Response:**
```json
{
  "success": true,
  "data": {
    "initialized": true,
    "modelsLoaded": true,
    "uptime": 3600,
    "performance": {
      "averageLatency": 150,
      "requestsProcessed": 1250,
      "cacheHitRate": 0.85
    }
  }
}
```

## 🧠 Algoritmos Implementados

### 1. Detección de Anomalías
- **Z-Score**: Detecta valores que se desvían significativamente de la media
- **IQR (Rango Intercuartílico)**: Identifica outliers basados en cuartiles
- **Detección Temporal**: Analiza patrones temporales anómalos
- **Ensemble**: Combina múltiples métodos para mayor precisión

### 2. Predicción de Riesgo
- **Red Neuronal (brain.js)**: Aprende patrones complejos de los datos
- **Reglas Heurísticas**: Sistema de reglas basado en conocimiento experto
- **Enfoque Híbrido**: Combina ML y reglas para balance entre precisión y explicabilidad

### 3. Análisis de Patrones
- **Correlación de Pearson**: Encuentra relaciones entre variables
- **Análisis de Tendencias**: Detecta tendencias lineales en el tiempo
- **Patrones Temporales**: Identifica patrones que se repiten en el tiempo
- **Patrones Conductuales**: Analiza cambios en el comportamiento del usuario

## 📊 Características Extraídas

El sistema extrae 12 características principales:

1. **avgAcceleration**: Aceleración promedio
2. **maxAcceleration**: Aceleración máxima
3. **accelerationVariance**: Varianza de la aceleración
4. **avgTilt**: Inclinación promedio
5. **maxTilt**: Inclinación máxima
6. **tiltVariance**: Varianza de la inclinación
7. **movementDuration**: Duración del movimiento
8. **movementFrequency**: Frecuencia de movimientos
9. **fallCount**: Número de caídas
10. **hourOfDay**: Hora del día (normalizada)
11. **dayOfWeek**: Día de la semana (normalizado)
12. **timeSinceLastFall**: Tiempo desde la última caída

## ⚙️ Configuración

### Thresholds (Umbrales)
```typescript
THRESHOLDS: {
  ACCELERATION_HIGH: 10.0,      // g
  ACCELERATION_LOW: 0.1,        // g
  TILT_HIGH: 60,                // grados
  VARIANCE_HIGH: 2.0,
  Z_SCORE_THRESHOLD: 3.0,       // desviaciones estándar
  IQR_MULTIPLIER: 1.5,
  RISK_HIGH: 0.7,               // 70%
  RISK_MEDIUM: 0.4,             // 40%
}
```

### Red Neuronal
```typescript
NEURAL_NETWORK_CONFIG: {
  hiddenLayers: [8],            // 1 capa oculta con 8 neuronas
  activation: 'sigmoid',
  learningRate: 0.3,
  iterations: 20000,
  errorThresh: 0.005,
}
```

## 🔧 Uso Programático

### Ejemplo 1: Análisis Simple
```typescript
import { aiService } from './ai/aiService';

const analysis = await aiService.analyzeUser(userId);
console.log(`Risk Level: ${analysis.riskLevel}`);
console.log(`Alerts: ${analysis.alerts.length}`);
```

### Ejemplo 2: Detección en Tiempo Real
```typescript
const anomalies = await aiService.detectAnomalies('ESP32_001', 5);
if (anomalies.criticalAnomalies > 0) {
  // Enviar notificación urgente
}
```

### Ejemplo 3: Predicción Proactiva
```typescript
const prediction = await aiService.predictFall('ESP32_001', 24);
if (prediction.prediction.probability > 0.7) {
  // Activar protocolo de prevención
}
```

## 📈 Optimizaciones para Producción

### 1. Caching
- Cache de análisis: 5 minutos TTL
- Cache de patrones: 15 minutos TTL
- Limpieza automática cada 10 minutos

### 2. Lazy Loading
- Los modelos de ML se cargan solo cuando se necesitan
- Inicialización asíncrona para no bloquear el servidor

### 3. Batch Processing
- Análisis por lotes para reducir overhead
- Procesamiento paralelo cuando es posible

### 4. Memory Management
- Red neuronal pequeña (8 neuronas ocultas)
- Sin dependencias nativas (no node-gyp)
- Optimizado para 512MB RAM (Render.com free tier)

## 🧪 Testing

### Probar Health Check
```bash
curl http://localhost:3000/api/ai/health
```

### Probar Análisis de Usuario
```bash
curl http://localhost:3000/api/ai/analyze/1
```

### Probar Detección de Anomalías
```bash
curl "http://localhost:3000/api/ai/anomalies/ESP32_001?timeWindow=60"
```

### Probar Predicción
```bash
curl -X POST http://localhost:3000/api/ai/predict-fall \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "ESP32_001", "timeWindow": 24}'
```

## 🚨 Manejo de Errores

Todos los endpoints retornan errores en el siguiente formato:

```json
{
  "success": false,
  "message": "Failed to analyze user",
  "error": "Detailed error message"
}
```

Códigos de estado HTTP:
- `200`: Éxito
- `400`: Bad Request (parámetros inválidos)
- `500`: Error del servidor
- `503`: Service Unavailable (AI no inicializado)

## 📝 Logs

El sistema utiliza un logger colorizado que registra:
- ✓ Operaciones exitosas (verde)
- ℹ️ Información general (azul)
- ⚠️ Advertencias (amarillo)
- ✗ Errores (rojo)

## 🔐 Seguridad

- Autenticación JWT en producción (comentada en desarrollo)
- Validación de parámetros en todos los endpoints
- Sanitización de inputs
- Rate limiting recomendado para producción

## 📊 Métricas y Monitoreo

El sistema registra:
- Latencia promedio de requests
- Tasa de acierto del cache
- Número de análisis procesados
- Anomalías detectadas por hora
- Alertas generadas por severidad

## 🚀 Deployment

### Variables de Entorno Requeridas
```env
# Redis (Upstash)
REDIS_URL=redis://...
REDIS_TOKEN=...

# PostgreSQL (Neon)
DATABASE_URL=postgresql://...

# General
NODE_ENV=production
PORT=3000
```

### Inicialización
El sistema se inicializa automáticamente al arrancar el servidor:
```typescript
await aiEngine.initialize();
```

Si falla la inicialización, el servidor arranca sin capacidades de IA y registra una advertencia.

## 📚 Referencias

- Brain.js: https://brain.js.org/
- Z-Score Anomaly Detection: https://en.wikipedia.org/wiki/Standard_score
- IQR Method: https://en.wikipedia.org/wiki/Interquartile_range
- Pearson Correlation: https://en.wikipedia.org/wiki/Pearson_correlation_coefficient
