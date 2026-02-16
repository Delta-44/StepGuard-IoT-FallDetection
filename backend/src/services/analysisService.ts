import { EventoCaidaModel } from "../models/eventoCaida";

export class AnalysisService {

    /**
     * Analizar patrones de caídas y alertas para un usuario.
     * @param userId ID del usuario a analizar
     * @param days Días de historial a considerar (default 30)
     */
    static async analyzeUserTrends(userId: number, days: number = 30) {

        // 1. Obtener datos crudos
        const hourlyStats = await EventoCaidaModel.getHourlyTrend(userId, days);
        const weeklyStats = await EventoCaidaModel.getWeeklyTrend(userId, days);
        const dailyEvolution = await EventoCaidaModel.getDailyEvolution(userId, days);
        const generalStats = await EventoCaidaModel.getEstadisticas(userId);

        // 2. Procesar Insights
        const insights: string[] = [];

        // Insight: Horas Críticas
        if (hourlyStats.length > 0) {
            const topHour = hourlyStats[0];
            insights.push(`Hora más crítica: ${topHour.hora}:00 (${topHour.cantidad} eventos).`);
        } else {
            insights.push("No hay suficientes datos para determinar horas críticas.");
        }

        // Insight: Días Críticos
        if (weeklyStats.length > 0) {
            const daysMap = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
            const topDay = weeklyStats[0];
            insights.push(`Día con más incidentes: ${daysMap[parseInt(topDay.dia_semana)]} (${topDay.cantidad} eventos).`);
        }

        // Insight: Tendencia Reciente (Crecimiento)
        if (dailyEvolution.length >= 2) {
            const firstHalf = dailyEvolution.slice(0, Math.floor(dailyEvolution.length / 2));
            const secondHalf = dailyEvolution.slice(Math.floor(dailyEvolution.length / 2));

            const avg1 = firstHalf.reduce((acc, curr) => acc + parseInt(curr.cantidad), 0) / firstHalf.length;
            const avg2 = secondHalf.reduce((acc, curr) => acc + parseInt(curr.cantidad), 0) / secondHalf.length;

            if (avg2 > avg1 * 1.5) {
                insights.push("ALERTA TENDENCIA: La frecuencia de eventos ha aumentado significativamente en la segunda mitad del periodo.");
            } else if (avg2 < avg1 * 0.5) {
                insights.push("Tendencia positiva: La frecuencia de eventos está disminuyendo.");
            } else {
                insights.push("La frecuencia de eventos se mantiene estable.");
            }
        }

        // 3. Estructurar respuesta para el LLM
        return {
            analysis_period_days: days,
            total_events_in_period: generalStats.total_eventos,
            critical_hours: hourlyStats.slice(0, 3).map(h => ({ hour: parseInt(h.hora), count: parseInt(h.cantidad) })),
            critical_days: weeklyStats.slice(0, 3).map(d => ({ day: parseInt(d.dia_semana), count: parseInt(d.cantidad) })),
            daily_trend: dailyEvolution.map(d => ({ date: d.fecha.toISOString().split('T')[0], count: parseInt(d.cantidad) })),
            ai_insights: insights
        };
    }
}
