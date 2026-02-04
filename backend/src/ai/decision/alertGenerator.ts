/**
 * Generador de Alertas
 * Crea y gestiona alertas basadas en análisis de IA
 */

import { logger } from '../utils/logger';
import { ALERT_MESSAGES, AI_CONFIG } from '../config';
import type { Alert, RiskPrediction, AnomalyResult } from '../types';

export class AlertGenerator {
  /**
   * Genera alerta basada en predicción de riesgo
   */
  generateRiskAlert(
    userId: number,
    deviceId: string,
    prediction: RiskPrediction,
    data?: any
  ): Alert | null {
    if (!AI_CONFIG.alerts.enabled) {
      return null;
    }

    const { riskLevel, riskScore } = prediction;

    // Solo generar alertas para riesgo medio o superior
    if (riskScore < AI_CONFIG.alerts.thresholds.medium) {
      return null;
    }

    const severity = this.mapRiskToSeverity(riskLevel);
    const message = ALERT_MESSAGES.high_risk[severity];
    const actionRequired = riskScore >= AI_CONFIG.alerts.thresholds.high;

    const recommendations = this.generateRiskRecommendations(prediction);

    return {
      userId,
      deviceId,
      type: 'high_risk',
      severity,
      message,
      timestamp: new Date(),
      data: {
        riskScore,
        riskLevel,
        factors: prediction.factors,
        ...data,
      },
      actionRequired,
      recommendations,
    };
  }

  /**
   * Genera alerta por anomalía detectada
   */
  generateAnomalyAlert(
    userId: number,
    deviceId: string,
    anomaly: AnomalyResult,
    data?: any
  ): Alert | null {
    if (!AI_CONFIG.alerts.enabled || !anomaly.isAnomaly) {
      return null;
    }

    const severity = this.mapAnomalyToSeverity(anomaly.anomalyScore);
    const message = ALERT_MESSAGES.anomaly[severity];
    const actionRequired = anomaly.anomalyScore >= 0.7;

    const recommendations = this.generateAnomalyRecommendations(anomaly);

    return {
      userId,
      deviceId,
      type: 'anomaly',
      severity,
      message,
      timestamp: new Date(),
      data: {
        anomalyScore: anomaly.anomalyScore,
        zScore: anomaly.zScore,
        reason: anomaly.reason,
        ...data,
      },
      actionRequired,
      recommendations,
    };
  }

  /**
   * Genera alerta por detección de caída
   */
  generateFallAlert(
    userId: number,
    deviceId: string,
    fallData: any
  ): Alert {
    const severity = this.determineFallSeverity(fallData);
    const message = ALERT_MESSAGES.fall_detected[severity];
    const actionRequired = true; // Siempre requiere acción

    const recommendations = this.generateFallRecommendations(fallData);

    return {
      userId,
      deviceId,
      type: 'fall_detected',
      severity,
      message,
      timestamp: new Date(),
      data: fallData,
      actionRequired,
      recommendations,
    };
  }

  /**
   * Genera alerta por cambio de patrón
   */
  generatePatternChangeAlert(
    userId: number,
    deviceId: string,
    patternChange: any
  ): Alert | null {
    if (!AI_CONFIG.alerts.enabled) {
      return null;
    }

    const severity = this.mapPatternChangeToSeverity(patternChange.significance);
    
    // Solo alertar cambios significativos
    if (patternChange.significance < 0.5) {
      return null;
    }

    const message = ALERT_MESSAGES.pattern_change[severity];
    const actionRequired = patternChange.significance >= 0.8;

    return {
      userId,
      deviceId,
      type: 'pattern_change',
      severity,
      message: `${message}: ${patternChange.description}`,
      timestamp: new Date(),
      data: patternChange,
      actionRequired,
      recommendations: [
        'Review recent activity patterns',
        'Check if user routine has changed',
        'Consider adjusting monitoring sensitivity',
      ],
    };
  }

  /**
   * Mapea nivel de riesgo a severidad de alerta
   */
  private mapRiskToSeverity(
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ): 'low' | 'medium' | 'high' | 'critical' {
    return riskLevel; // Mapeo directo
  }

  /**
   * Mapea score de anomalía a severidad
   */
  private mapAnomalyToSeverity(
    anomalyScore: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (anomalyScore >= 0.9) return 'critical';
    if (anomalyScore >= 0.7) return 'high';
    if (anomalyScore >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Mapea significancia de cambio de patrón a severidad
   */
  private mapPatternChangeToSeverity(
    significance: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (significance >= 0.9) return 'critical';
    if (significance >= 0.75) return 'high';
    if (significance >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Determina severidad de una caída basada en datos del sensor
   */
  private determineFallSeverity(fallData: any): 'low' | 'medium' | 'high' | 'critical' {
    const magnitude = Math.sqrt(
      (fallData.acc_x || 0) ** 2 +
      (fallData.acc_y || 0) ** 2 +
      (fallData.acc_z || 0) ** 2
    );

    if (magnitude > 25) return 'critical';
    if (magnitude > 20) return 'high';
    if (magnitude > 15) return 'medium';
    return 'low';
  }

  /**
   * Genera recomendaciones para alerta de riesgo
   */
  private generateRiskRecommendations(prediction: RiskPrediction): string[] {
    const recommendations: string[] = [];

    // Recomendaciones basadas en factores de riesgo
    prediction.factors.forEach(factor => {
      if (factor.impact === 'negative') {
        switch (factor.name) {
          case 'Recent Falls':
            recommendations.push('Increase monitoring frequency');
            recommendations.push('Review environment for hazards');
            break;
          case 'High Acceleration':
            recommendations.push('Check device placement and calibration');
            recommendations.push('Monitor for unusual movement patterns');
            break;
          case 'Movement Instability':
            recommendations.push('Consider mobility assessment');
            recommendations.push('Review medication side effects');
            break;
          case 'High-Risk Time':
            recommendations.push('Increase supervision during nighttime');
            recommendations.push('Ensure adequate lighting');
            break;
        }
      }
    });

    // Recomendaciones generales
    if (prediction.riskLevel === 'critical') {
      recommendations.push('⚠️ URGENT: Check on user immediately');
      recommendations.push('Consider emergency contact notification');
    } else if (prediction.riskLevel === 'high') {
      recommendations.push('Schedule immediate check-in');
      recommendations.push('Review recent activity logs');
    }

    // Eliminar duplicados
    return [...new Set(recommendations)];
  }

  /**
   * Genera recomendaciones para alerta de anomalía
   */
  private generateAnomalyRecommendations(anomaly: AnomalyResult): string[] {
    const recommendations: string[] = [
      'Verify sensor readings are accurate',
      'Check device battery and connection',
      'Review recent user activity',
    ];

    if (anomaly.anomalyScore > 0.8) {
      recommendations.unshift('Investigate unusual readings immediately');
      recommendations.push('Consider device malfunction or tampering');
    }

    if (anomaly.reason) {
      recommendations.push(`Analysis: ${anomaly.reason}`);
    }

    return recommendations;
  }

  /**
   * Genera recomendaciones para alerta de caída
   */
  private generateFallRecommendations(fallData: any): string[] {
    const magnitude = Math.sqrt(
      (fallData.acc_x || 0) ** 2 +
      (fallData.acc_y || 0) ** 2 +
      (fallData.acc_z || 0) ** 2
    );

    const recommendations = [
      '🚨 Check on user immediately',
      'Verify user is safe and conscious',
      'Document incident details',
    ];

    if (magnitude > 20) {
      recommendations.unshift('⚠️ HIGH IMPACT DETECTED - Consider emergency services');
      recommendations.push('Assess for injuries');
      recommendations.push('Monitor vital signs if possible');
    } else {
      recommendations.push('If false alarm, update event status');
    }

    return recommendations;
  }

  /**
   * Filtra alertas duplicadas
   */
  deduplicateAlerts(alerts: Alert[], timeWindowMinutes: number = 5): Alert[] {
    const uniqueAlerts: Alert[] = [];
    const alertMap = new Map<string, Alert>();

    alerts.forEach(alert => {
      const key = `${alert.userId}-${alert.deviceId}-${alert.type}`;
      const existing = alertMap.get(key);

      if (!existing) {
        alertMap.set(key, alert);
        uniqueAlerts.push(alert);
      } else {
        // Solo mantener si es más reciente y dentro de la ventana de tiempo
        const timeDiff = Math.abs(
          alert.timestamp.getTime() - existing.timestamp.getTime()
        );
        const windowMs = timeWindowMinutes * 60 * 1000;

        if (timeDiff > windowMs) {
          uniqueAlerts.push(alert);
        } else if (alert.severity > existing.severity) {
          // Reemplazar con alerta más severa
          const index = uniqueAlerts.indexOf(existing);
          if (index !== -1) {
            uniqueAlerts[index] = alert;
          }
          alertMap.set(key, alert);
        }
      }
    });

    return uniqueAlerts;
  }

  /**
   * Prioriza alertas por severidad y tipo
   */
  prioritizeAlerts(alerts: Alert[]): Alert[] {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const typeOrder = {
      fall_detected: 4,
      high_risk: 3,
      anomaly: 2,
      pattern_change: 1,
    };

    return [...alerts].sort((a, b) => {
      // Primero por severidad
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;

      // Luego por tipo
      const typeDiff = typeOrder[b.type] - typeOrder[a.type];
      if (typeDiff !== 0) return typeDiff;

      // Finalmente por timestamp (más reciente primero)
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }

  /**
   * Formatea alerta para notificación
   */
  formatAlertForNotification(alert: Alert): any {
    const icons = {
      fall_detected: '🚨',
      high_risk: '⚠️',
      anomaly: '🔍',
      pattern_change: '📊',
    };

    return {
      title: `${icons[alert.type]} ${alert.type.replace('_', ' ').toUpperCase()}`,
      message: alert.message,
      severity: alert.severity,
      timestamp: alert.timestamp.toISOString(),
      actionRequired: alert.actionRequired,
      recommendations: alert.recommendations.slice(0, 3), // Top 3
      data: alert.data,
    };
  }

  /**
   * Valida si una alerta debe ser enviada
   */
  shouldSendAlert(alert: Alert, userPreferences?: any): boolean {
    // Verificar si alertas están habilitadas
    if (!AI_CONFIG.alerts.enabled) {
      return false;
    }

    // Verificar preferencias del usuario
    if (userPreferences) {
      // Solo alertas críticas fuera de horario
      if (userPreferences.quietHours) {
        const hour = alert.timestamp.getHours();
        if (hour >= 22 || hour < 7) {
          return alert.severity === 'critical';
        }
      }

      // Filtro de severidad mínima
      if (userPreferences.minSeverity) {
        const severityOrder: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
        if (severityOrder[alert.severity] < severityOrder[userPreferences.minSeverity]) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Genera resumen de alertas
   */
  generateAlertSummary(alerts: Alert[]): any {
    const byType = {
      fall_detected: alerts.filter(a => a.type === 'fall_detected').length,
      high_risk: alerts.filter(a => a.type === 'high_risk').length,
      anomaly: alerts.filter(a => a.type === 'anomaly').length,
      pattern_change: alerts.filter(a => a.type === 'pattern_change').length,
    };

    const bySeverity = {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
    };

    const actionRequired = alerts.filter(a => a.actionRequired).length;

    return {
      total: alerts.length,
      byType,
      bySeverity,
      actionRequired,
      mostRecent: alerts.length > 0 ? alerts[0].timestamp : null,
    };
  }
}

export const alertGenerator = new AlertGenerator();
