/**
 * Analizador de Patrones
 * Identifica patrones temporales y comportamentales en los datos
 */

import { mean, linearTrend, pearsonCorrelation } from '../utils/mathUtils';
import { logger } from '../utils/logger';
import { TIME_SLOTS } from '../config';
import type { PatternAnalysis, Pattern, Trend, HistoricalEvent } from '../types';

export class PatternAnalyzer {
  /**
   * Analiza patrones completos en los datos históricos
   */
  analyze(events: HistoricalEvent[], windowDays: number = 30): PatternAnalysis {
    logger.debug(`Analyzing patterns for ${events.length} events over ${windowDays} days`);

    const patterns = this.identifyPatterns(events, windowDays);
    const trends = this.identifyTrends(events);
    const insights = this.generateInsights(patterns, trends, events);

    return {
      patterns,
      trends,
      insights,
    };
  }

  /**
   * Identifica patrones en los datos
   */
  private identifyPatterns(
    events: HistoricalEvent[],
    windowDays: number
  ): Pattern[] {
    const patterns: Pattern[] = [];

    // Patrones temporales (por hora del día)
    const temporalPatterns = this.findTemporalPatterns(events);
    patterns.push(...temporalPatterns);

    // Patrones comportamentales (por tipo de respuesta)
    const behavioralPatterns = this.findBehavioralPatterns(events);
    patterns.push(...behavioralPatterns);

    // Patrones de severidad
    const severityPatterns = this.findSeverityPatterns(events);
    patterns.push(...severityPatterns);

    // Ordenar por confianza
    patterns.sort((a, b) => b.confidence - a.confidence);

    return patterns;
  }

  /**
   * Encuentra patrones temporales (horas del día, días de la semana)
   */
  private findTemporalPatterns(events: HistoricalEvent[]): Pattern[] {
    const patterns: Pattern[] = [];

    if (events.length < 5) return patterns;

    // Agrupar eventos por hora del día
    const eventsByHour = new Map<number, number>();
    events.forEach(event => {
      const hour = event.fecha_hora.getHours();
      eventsByHour.set(hour, (eventsByHour.get(hour) || 0) + 1);
    });

    // Encontrar horas con alta frecuencia
    const avgEventsPerHour = events.length / 24;
    const threshold = avgEventsPerHour * 1.5;

    eventsByHour.forEach((count, hour) => {
      if (count > threshold && count >= 3) {
        const timeSlot = this.getTimeSlot(hour);
        patterns.push({
          type: 'temporal',
          description: `High activity during ${timeSlot} (${hour}:00 - ${hour + 1}:00)`,
          frequency: count,
          confidence: Math.min(1, count / events.length * 5),
          startDate: events[events.length - 1].fecha_hora,
          endDate: events[0].fecha_hora,
        });
      }
    });

    // Patrones de día de la semana
    const eventsByDayOfWeek = new Map<number, number>();
    events.forEach(event => {
      const day = event.fecha_hora.getDay();
      eventsByDayOfWeek.set(day, (eventsByDayOfWeek.get(day) || 0) + 1);
    });

    const avgEventsPerDay = events.length / 7;
    const dayThreshold = avgEventsPerDay * 1.3;

    eventsByDayOfWeek.forEach((count, day) => {
      if (count > dayThreshold && count >= 3) {
        const dayName = this.getDayName(day);
        patterns.push({
          type: 'temporal',
          description: `Increased activity on ${dayName}s`,
          frequency: count,
          confidence: Math.min(1, count / events.length * 3),
          startDate: events[events.length - 1].fecha_hora,
          endDate: events[0].fecha_hora,
        });
      }
    });

    return patterns;
  }

  /**
   * Encuentra patrones comportamentales
   */
  private findBehavioralPatterns(events: HistoricalEvent[]): Pattern[] {
    const patterns: Pattern[] = [];

    if (events.length < 10) return patterns;

    // Analizar tasa de respuesta
    const attendedRate = events.filter(e => e.estado === 'atendida').length / events.length;
    const falseAlarmRate = events.filter(e => e.estado === 'falsa_alarma').length / events.length;
    const ignoredRate = events.filter(e => e.estado === 'ignorada').length / events.length;

    if (attendedRate > 0.8) {
      patterns.push({
        type: 'behavioral',
        description: 'High response rate - excellent caregiver engagement',
        frequency: events.filter(e => e.estado === 'atendida').length,
        confidence: 0.9,
        startDate: events[events.length - 1].fecha_hora,
        endDate: events[0].fecha_hora,
      });
    }

    if (falseAlarmRate > 0.3) {
      patterns.push({
        type: 'behavioral',
        description: 'High false alarm rate - sensor may need recalibration',
        frequency: events.filter(e => e.estado === 'falsa_alarma').length,
        confidence: 0.85,
        startDate: events[events.length - 1].fecha_hora,
        endDate: events[0].fecha_hora,
      });
    }

    if (ignoredRate > 0.2) {
      patterns.push({
        type: 'behavioral',
        description: 'Significant number of ignored alerts - review notification settings',
        frequency: events.filter(e => e.estado === 'ignorada').length,
        confidence: 0.8,
        startDate: events[events.length - 1].fecha_hora,
        endDate: events[0].fecha_hora,
      });
    }

    // Analizar tiempo de respuesta
    const responseTimes = events
      .filter(e => e.fecha_atencion && e.estado === 'atendida')
      .map(e => {
        const responseTime = e.fecha_atencion!.getTime() - e.fecha_hora.getTime();
        return responseTime / 1000 / 60; // minutos
      });

    if (responseTimes.length >= 5) {
      const avgResponseTime = mean(responseTimes);
      
      if (avgResponseTime < 5) {
        patterns.push({
          type: 'behavioral',
          description: 'Very fast response times (< 5 minutes average)',
          frequency: responseTimes.length,
          confidence: 0.9,
          startDate: events[events.length - 1].fecha_hora,
          endDate: events[0].fecha_hora,
        });
      } else if (avgResponseTime > 30) {
        patterns.push({
          type: 'behavioral',
          description: 'Slow response times (> 30 minutes average)',
          frequency: responseTimes.length,
          confidence: 0.85,
          startDate: events[events.length - 1].fecha_hora,
          endDate: events[0].fecha_hora,
        });
      }
    }

    return patterns;
  }

  /**
   * Encuentra patrones de severidad
   */
  private findSeverityPatterns(events: HistoricalEvent[]): Pattern[] {
    const patterns: Pattern[] = [];

    if (events.length < 5) return patterns;

    const severityCounts = {
      low: events.filter(e => e.severidad === 'low').length,
      medium: events.filter(e => e.severidad === 'medium').length,
      high: events.filter(e => e.severidad === 'high').length,
      critical: events.filter(e => e.severidad === 'critical').length,
    };

    const total = events.length;

    // Alta proporción de eventos críticos
    if (severityCounts.critical / total > 0.2) {
      patterns.push({
        type: 'behavioral',
        description: 'High proportion of critical severity events',
        frequency: severityCounts.critical,
        confidence: 0.9,
        startDate: events[events.length - 1].fecha_hora,
        endDate: events[0].fecha_hora,
      });
    }

    // Tendencia creciente en severidad
    const severityValues = events.map(e => {
      const map = { low: 1, medium: 2, high: 3, critical: 4 };
      return map[e.severidad];
    });

    const trend = linearTrend(severityValues);
    if (trend > 0.05) {
      patterns.push({
        type: 'behavioral',
        description: 'Increasing severity trend - events becoming more serious',
        frequency: events.length,
        confidence: 0.75,
        startDate: events[events.length - 1].fecha_hora,
        endDate: events[0].fecha_hora,
      });
    } else if (trend < -0.05) {
      patterns.push({
        type: 'behavioral',
        description: 'Decreasing severity trend - positive improvement',
        frequency: events.length,
        confidence: 0.75,
        startDate: events[events.length - 1].fecha_hora,
        endDate: events[0].fecha_hora,
      });
    }

    return patterns;
  }

  /**
   * Identifica tendencias en los datos
   */
  private identifyTrends(events: HistoricalEvent[]): Trend[] {
    const trends: Trend[] = [];

    if (events.length < 10) return trends;

    // Ordenar eventos por fecha
    const sortedEvents = [...events].sort((a, b) => 
      a.fecha_hora.getTime() - b.fecha_hora.getTime()
    );

    // Tendencia de frecuencia de eventos
    const frequencyTrend = this.analyzeFallFrequencyTrend(sortedEvents);
    if (frequencyTrend) trends.push(frequencyTrend);

    // Tendencia de severidad
    const severityTrend = this.analyzeSeverityTrend(sortedEvents);
    if (severityTrend) trends.push(severityTrend);

    // Tendencia de tiempo de respuesta
    const responseTimeTrend = this.analyzeResponseTimeTrend(sortedEvents);
    if (responseTimeTrend) trends.push(responseTimeTrend);

    return trends;
  }

  /**
   * Analiza tendencia de frecuencia de caídas
   */
  private analyzeFallFrequencyTrend(events: HistoricalEvent[]): Trend | null {
    if (events.length < 10) return null;

    // Dividir en dos mitades y comparar frecuencias
    const mid = Math.floor(events.length / 2);
    const firstHalf = events.slice(0, mid);
    const secondHalf = events.slice(mid);

    const firstHalfDays = (firstHalf[firstHalf.length - 1].fecha_hora.getTime() - 
                           firstHalf[0].fecha_hora.getTime()) / (1000 * 60 * 60 * 24);
    const secondHalfDays = (secondHalf[secondHalf.length - 1].fecha_hora.getTime() - 
                            secondHalf[0].fecha_hora.getTime()) / (1000 * 60 * 60 * 24);

    const firstRate = firstHalf.length / Math.max(1, firstHalfDays);
    const secondRate = secondHalf.length / Math.max(1, secondHalfDays);

    const change = ((secondRate - firstRate) / Math.max(0.01, firstRate)) * 100;

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (change > 20) direction = 'increasing';
    else if (change < -20) direction = 'decreasing';
    else direction = 'stable';

    return {
      metric: 'Fall Frequency',
      direction,
      rate: Math.abs(change),
      significance: Math.min(1, Math.abs(change) / 50),
    };
  }

  /**
   * Analiza tendencia de severidad
   */
  private analyzeSeverityTrend(events: HistoricalEvent[]): Trend | null {
    if (events.length < 10) return null;

    const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
    const severityValues = events.map(e => severityMap[e.severidad]);

    const trend = linearTrend(severityValues);

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (trend > 0.02) direction = 'increasing';
    else if (trend < -0.02) direction = 'decreasing';
    else direction = 'stable';

    return {
      metric: 'Severity Level',
      direction,
      rate: Math.abs(trend * 100),
      significance: Math.min(1, Math.abs(trend) * 20),
    };
  }

  /**
   * Analiza tendencia de tiempo de respuesta
   */
  private analyzeResponseTimeTrend(events: HistoricalEvent[]): Trend | null {
    const responseTimes = events
      .filter(e => e.fecha_atencion && e.estado === 'atendida')
      .map(e => (e.fecha_atencion!.getTime() - e.fecha_hora.getTime()) / 1000 / 60);

    if (responseTimes.length < 5) return null;

    const trend = linearTrend(responseTimes);

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (trend > 1) direction = 'increasing'; // Empeorando
    else if (trend < -1) direction = 'decreasing'; // Mejorando
    else direction = 'stable';

    return {
      metric: 'Response Time',
      direction,
      rate: Math.abs(trend),
      significance: Math.min(1, Math.abs(trend) / 5),
    };
  }

  /**
   * Genera insights basados en patrones y tendencias
   */
  private generateInsights(
    patterns: Pattern[],
    trends: Trend[],
    events: HistoricalEvent[]
  ): string[] {
    const insights: string[] = [];

    // Insights sobre eventos recientes
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEvents = events.filter(e => e.fecha_hora >= last24h);

    if (recentEvents.length > 5) {
      insights.push(`⚠️ High activity: ${recentEvents.length} events in the last 24 hours`);
    }

    // Insights sobre patrones temporales
    const temporalPatterns = patterns.filter(p => p.type === 'temporal');
    if (temporalPatterns.length > 0) {
      const topPattern = temporalPatterns[0];
      insights.push(`🕒 ${topPattern.description}`);
    }

    // Insights sobre tendencias
    const increasingTrends = trends.filter(t => t.direction === 'increasing');
    if (increasingTrends.length > 0) {
      increasingTrends.forEach(trend => {
        if (trend.significance > 0.5) {
          insights.push(`📈 ${trend.metric} is increasing (${trend.rate.toFixed(1)}% change)`);
        }
      });
    }

    const decreasingTrends = trends.filter(t => t.direction === 'decreasing');
    if (decreasingTrends.length > 0) {
      decreasingTrends.forEach(trend => {
        if (trend.significance > 0.5) {
          insights.push(`📉 ${trend.metric} is decreasing (${trend.rate.toFixed(1)}% improvement)`);
        }
      });
    }

    // Insights sobre comportamiento
    const falseAlarmRate = events.filter(e => e.estado === 'falsa_alarma').length / events.length;
    if (falseAlarmRate > 0.3) {
      insights.push(`⚙️ High false alarm rate (${(falseAlarmRate * 100).toFixed(1)}%) - consider sensor recalibration`);
    }

    // Insights positivos
    const attendedRate = events.filter(e => e.estado === 'atendida').length / events.length;
    if (attendedRate > 0.8) {
      insights.push(`✅ Excellent response rate (${(attendedRate * 100).toFixed(1)}%)`);
    }

    return insights;
  }

  /**
   * Determina el slot de tiempo
   */
  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Obtiene el nombre del día de la semana
   */
  private getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  }

  /**
   * Busca correlaciones entre características
   */
  findCorrelations(
    feature1: number[],
    feature2: number[],
    featureName1: string,
    featureName2: string
  ): { correlation: number; strength: string; description: string } {
    if (feature1.length !== feature2.length || feature1.length < 3) {
      return {
        correlation: 0,
        strength: 'none',
        description: 'Insufficient data for correlation analysis',
      };
    }

    const correlation = pearsonCorrelation(feature1, feature2);
    const absCorr = Math.abs(correlation);

    let strength: string;
    if (absCorr > 0.8) strength = 'very strong';
    else if (absCorr > 0.6) strength = 'strong';
    else if (absCorr > 0.4) strength = 'moderate';
    else if (absCorr > 0.2) strength = 'weak';
    else strength = 'very weak';

    const direction = correlation > 0 ? 'positive' : 'negative';

    return {
      correlation,
      strength,
      description: `${strength} ${direction} correlation between ${featureName1} and ${featureName2} (r=${correlation.toFixed(3)})`,
    };
  }
}

export const patternAnalyzer = new PatternAnalyzer();
