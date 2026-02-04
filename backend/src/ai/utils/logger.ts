/**
 * Logger personalizado para el sistema de IA
 */

import { LOG_CONFIG } from '../config';

type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

class AILogger {
  private enabled: boolean;
  private prefix: string;
  private colors: typeof LOG_CONFIG.colors;

  constructor() {
    this.enabled = LOG_CONFIG.enabled;
    this.prefix = LOG_CONFIG.prefix;
    this.colors = LOG_CONFIG.colors;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const color = this.colors[level as keyof typeof this.colors] || '';
    const reset = this.colors.reset;
    
    let formatted = `${color}${this.prefix} [${level.toUpperCase()}] ${timestamp}${reset} - ${message}`;
    
    if (data) {
      formatted += `\n${JSON.stringify(data, null, 2)}`;
    }
    
    return formatted;
  }

  info(message: string, data?: any): void {
    if (this.enabled) {
      console.log(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.enabled) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, error?: any): void {
    if (this.enabled) {
      const errorData = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : error;
      console.error(this.formatMessage('error', message, errorData));
    }
  }

  success(message: string, data?: any): void {
    if (this.enabled) {
      console.log(this.formatMessage('success', message, data));
    }
  }

  debug(message: string, data?: any): void {
    if (this.enabled && LOG_CONFIG.level === 'debug') {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  // Método para logging de performance
  performance(operation: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.debug(`Performance: ${operation} completed in ${duration}ms`);
  }
}

export const logger = new AILogger();
