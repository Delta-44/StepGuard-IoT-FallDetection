/**
 * Motor de Recomendaciones
 * Genera recomendaciones personalizadas basadas en análisis de IA
 */

import { logger } from '../utils/logger';
import type {
  Recommendation,
  RiskPrediction,
  PatternAnalysis,
  ExtractedFeatures,
} from '../types';

export class RecommendationEngine {
  /**
   * Genera recomendaciones completas basadas en análisis
   */
  generate(
    userId: number,
    prediction: RiskPrediction,
    patterns: PatternAnalysis,
    features: Partial<ExtractedFeatures>
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Recomendaciones de seguridad
    recommendations.push(...this.generateSafetyRecommendations(prediction, features));

    // Recomendaciones de salud
    recommendations.push(...this.generateHealthRecommendations(prediction, patterns));

    // Recomendaciones de dispositivo
    recommendations.push(...this.generateDeviceRecommendations(features));

    // Recomendaciones de rutina
    recommendations.push(...this.generateRoutineRecommendations(patterns));

    // Ordenar por prioridad
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Limitar a top 10
    return recommendations.slice(0, 10);
  }

  /**
   * Genera recomendaciones de seguridad
   */
  private generateSafetyRecommendations(
    prediction: RiskPrediction,
    features: Partial<ExtractedFeatures>
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Alta varianza en movimiento
    if ((features.accelerationVariance || 0) > 7) {
      recommendations.push({
        id: `safety-instability-${Date.now()}`,
        category: 'safety',
        priority: 'high',
        title: 'Movement Instability Detected',
        description: 'High variance in movement patterns suggests potential balance issues',
        actions: [
          'Review environment for trip hazards',
          'Consider mobility aids assessment',
          'Check footwear for proper support',
          'Consult with healthcare provider',
        ],
        confidence: 0.85,
      });
    }

    // Caídas recientes frecuentes
    if ((features.fallCount24h || 0) > 2) {
      recommendations.push({
        id: `safety-frequent-falls-${Date.now()}`,
        category: 'safety',
        priority: 'high',
        title: 'Multiple Falls Detected',
        description: `${features.fallCount24h} falls detected in the last 24 hours`,
        actions: [
          'Seek immediate medical evaluation',
          'Increase supervision and monitoring',
          'Review medication side effects',
          'Conduct home safety assessment',
          'Consider emergency response system',
        ],
        confidence: 0.95,
      });
    }

    // Riesgo nocturno elevado
    if (
      (features.hourOfDay !== undefined && (features.hourOfDay >= 22 || features.hourOfDay < 6)) &&
      prediction.riskScore > 60
    ) {
      recommendations.push({
        id: `safety-nighttime-risk-${Date.now()}`,
        category: 'safety',
        priority: 'medium',
        title: 'Elevated Nighttime Risk',
        description: 'Higher fall risk during nighttime hours',
        actions: [
          'Install nightlights along pathways',
          'Keep assistive devices within reach',
          'Consider bedside commode',
          'Ensure emergency call button is accessible',
        ],
        confidence: 0.8,
      });
    }

    // Alta actividad
    if (features.activityLevel === 'high' && prediction.riskScore > 50) {
      recommendations.push({
        id: `safety-high-activity-${Date.now()}`,
        category: 'safety',
        priority: 'medium',
        title: 'High Activity with Risk',
        description: 'High activity level combined with elevated fall risk',
        actions: [
          'Encourage slower, more deliberate movements',
          'Schedule regular rest periods',
          'Review activity patterns with healthcare provider',
          'Consider supervised exercise program',
        ],
        confidence: 0.75,
      });
    }

    return recommendations;
  }

  /**
   * Genera recomendaciones de salud
   */
  private generateHealthRecommendations(
    prediction: RiskPrediction,
    patterns: PatternAnalysis
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Tendencia creciente en severidad
    const severityTrend = patterns.trends.find(t => t.metric === 'Severity Level');
    if (severityTrend && severityTrend.direction === 'increasing') {
      recommendations.push({
        id: `health-severity-increase-${Date.now()}`,
        category: 'health',
        priority: 'high',
        title: 'Increasing Fall Severity Trend',
        description: 'Falls are becoming more severe over time',
        actions: [
          'Schedule comprehensive medical evaluation',
          'Review all current medications',
          'Assess for underlying health conditions',
          'Consider physical therapy referral',
          'Evaluate vision and hearing',
        ],
        confidence: 0.8,
      });
    }

    // Frecuencia de caídas aumentando
    const frequencyTrend = patterns.trends.find(t => t.metric === 'Fall Frequency');
    if (frequencyTrend && frequencyTrend.direction === 'increasing') {
      recommendations.push({
        id: `health-frequency-increase-${Date.now()}`,
        category: 'health',
        priority: 'high',
        title: 'Increasing Fall Frequency',
        description: 'Falls are occurring more frequently',
        actions: [
          'Urgent medical consultation recommended',
          'Review medication changes',
          'Assess for new health conditions',
          'Consider balance and strength training',
        ],
        confidence: 0.85,
      });
    }

    // Patrones temporales específicos
    const temporalPatterns = patterns.patterns.filter(p => p.type === 'temporal');
    if (temporalPatterns.length > 0) {
      const topPattern = temporalPatterns[0];
      recommendations.push({
        id: `health-temporal-pattern-${Date.now()}`,
        category: 'health',
        priority: 'medium',
        title: 'Specific Time Pattern Identified',
        description: topPattern.description,
        actions: [
          'Monitor user closely during high-risk times',
          'Review daily routine and schedule',
          'Consider adjusting medication timing',
          'Ensure adequate supervision during peak hours',
        ],
        confidence: topPattern.confidence,
      });
    }

    return recommendations;
  }

  /**
   * Genera recomendaciones de dispositivo
   */
  private generateDeviceRecommendations(
    features: Partial<ExtractedFeatures>
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Alta tasa de falsas alarmas
    if ((features.falseAlarmRate || 0) > 0.3) {
      recommendations.push({
        id: `device-false-alarms-${Date.now()}`,
        category: 'device',
        priority: 'medium',
        title: 'High False Alarm Rate',
        description: `${((features.falseAlarmRate || 0) * 100).toFixed(1)}% false alarm rate detected`,
        actions: [
          'Recalibrate device sensors',
          'Check device placement and fit',
          'Verify device is worn correctly',
          'Update device firmware if available',
          'Consider sensitivity adjustment',
        ],
        confidence: 0.9,
      });
    }

    // Lecturas extremas frecuentes
    if ((features.maxAcceleration || 0) > 30) {
      recommendations.push({
        id: `device-extreme-readings-${Date.now()}`,
        category: 'device',
        priority: 'medium',
        title: 'Unusual Sensor Readings',
        description: 'Device reporting extreme acceleration values',
        actions: [
          'Inspect device for damage',
          'Verify device is securely attached',
          'Check battery level',
          'Test device functionality',
          'Contact technical support if issues persist',
        ],
        confidence: 0.75,
      });
    }

    return recommendations;
  }

  /**
   * Genera recomendaciones de rutina
   */
  private generateRoutineRecommendations(
    patterns: PatternAnalysis
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Patrones de comportamiento
    const behavioralPatterns = patterns.patterns.filter(p => p.type === 'behavioral');

    behavioralPatterns.forEach(pattern => {
      if (pattern.description.includes('response rate')) {
        recommendations.push({
          id: `routine-response-pattern-${Date.now()}`,
          category: 'routine',
          priority: 'low',
          title: 'Response Pattern Identified',
          description: pattern.description,
          actions: [
            'Continue current monitoring practices',
            'Document response protocols',
            'Share successful strategies with care team',
          ],
          confidence: pattern.confidence,
        });
      }

      if (pattern.description.includes('ignored alerts')) {
        recommendations.push({
          id: `routine-ignored-alerts-${Date.now()}`,
          category: 'routine',
          priority: 'medium',
          title: 'Alert Engagement Issue',
          description: pattern.description,
          actions: [
            'Review notification settings',
            'Verify alert channels are working',
            'Discuss alert preferences with caregivers',
            'Consider additional notification methods',
          ],
          confidence: pattern.confidence,
        });
      }
    });

    // Insights específicos
    if (patterns.insights.length > 0) {
      patterns.insights.forEach(insight => {
        if (insight.includes('activity')) {
          recommendations.push({
            id: `routine-activity-insight-${Date.now()}`,
            category: 'routine',
            priority: 'low',
            title: 'Activity Pattern Noted',
            description: insight,
            actions: [
              'Review daily activity schedule',
              'Ensure balanced routine',
              'Maintain consistent sleep schedule',
            ],
            confidence: 0.7,
          });
        }
      });
    }

    return recommendations;
  }

  /**
   * Genera recomendaciones personalizadas basadas en perfil del usuario
   */
  generatePersonalized(
    userProfile: {
      age?: number;
      conditions?: string[];
      medications?: string[];
      livingArrangement?: 'alone' | 'with_family' | 'assisted_living';
    },
    prediction: RiskPrediction
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Recomendaciones por edad
    if (userProfile.age && userProfile.age > 75) {
      recommendations.push({
        id: `personalized-age-${Date.now()}`,
        category: 'health',
        priority: 'medium',
        title: 'Age-Specific Recommendations',
        description: 'Tailored recommendations for senior care',
        actions: [
          'Regular strength and balance exercises',
          'Annual vision and hearing checks',
          'Bone density screening',
          'Review fall prevention strategies',
        ],
        confidence: 0.8,
      });
    }

    // Recomendaciones por arreglo de vivienda
    if (userProfile.livingArrangement === 'alone' && prediction.riskScore > 60) {
      recommendations.push({
        id: `personalized-living-alone-${Date.now()}`,
        category: 'safety',
        priority: 'high',
        title: 'Living Alone - Enhanced Monitoring',
        description: 'Additional safety measures for independent living',
        actions: [
          'Consider daily check-in system',
          'Install medical alert system',
          'Share emergency contacts with neighbors',
          'Keep phone within reach at all times',
          'Consider smart home monitoring devices',
        ],
        confidence: 0.9,
      });
    }

    return recommendations;
  }

  /**
   * Prioriza recomendaciones basadas en urgencia y relevancia
   */
  prioritize(recommendations: Recommendation[]): Recommendation[] {
    return [...recommendations].sort((a, b) => {
      // Primero por prioridad
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Luego por confianza
      return b.confidence - a.confidence;
    });
  }

  /**
   * Filtra recomendaciones duplicadas o similares
   */
  deduplicate(recommendations: Recommendation[]): Recommendation[] {
    const seen = new Set<string>();
    const unique: Recommendation[] = [];

    recommendations.forEach(rec => {
      const key = `${rec.category}-${rec.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(rec);
      }
    });

    return unique;
  }

  /**
   * Formatea recomendaciones para presentación al usuario
   */
  format(recommendations: Recommendation[]): any[] {
    return recommendations.map(rec => ({
      id: rec.id,
      category: rec.category.toUpperCase(),
      priority: rec.priority.toUpperCase(),
      title: rec.title,
      description: rec.description,
      actions: rec.actions,
      confidence: `${(rec.confidence * 100).toFixed(0)}%`,
      icon: this.getCategoryIcon(rec.category),
    }));
  }

  /**
   * Obtiene icono para cada categoría
   */
  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      safety: '🛡️',
      health: '❤️',
      device: '📱',
      routine: '📅',
    };
    return icons[category] || '💡';
  }

  /**
   * Genera resumen de recomendaciones
   */
  generateSummary(recommendations: Recommendation[]): any {
    const byCategory = {
      safety: recommendations.filter(r => r.category === 'safety').length,
      health: recommendations.filter(r => r.category === 'health').length,
      device: recommendations.filter(r => r.category === 'device').length,
      routine: recommendations.filter(r => r.category === 'routine').length,
    };

    const byPriority = {
      high: recommendations.filter(r => r.priority === 'high').length,
      medium: recommendations.filter(r => r.priority === 'medium').length,
      low: recommendations.filter(r => r.priority === 'low').length,
    };

    const avgConfidence =
      recommendations.length > 0
        ? recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length
        : 0;

    return {
      total: recommendations.length,
      byCategory,
      byPriority,
      avgConfidence: `${(avgConfidence * 100).toFixed(1)}%`,
      topPriority: recommendations.filter(r => r.priority === 'high').slice(0, 3),
    };
  }
}

export const recommendationEngine = new RecommendationEngine();
