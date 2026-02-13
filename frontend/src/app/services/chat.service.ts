import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
}

export interface ChatResponse {
  reply: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Envía un mensaje al chatbot MCP en el backend
   */
  sendMessage(message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, { message });
  }

  /**
   * Preguntas sugeridas basadas en las herramientas MCP disponibles
   */
  getSuggestedQuestions(userRole?: string): string[] {
    const commonQuestions = [
      '¿Cuántas caídas se detectaron hoy?',
      '¿Cuál es el estado de los dispositivos?',
      '¿Qué dispositivos están activos ahora?',
      'Muéstrame las estadísticas de la última semana',
    ];

    const adminQuestions = [
      '¿Cuántos usuarios tenemos registrados?',
      '¿Qué pacientes tienen más incidentes?',
      'Dame un resumen de todos los dispositivos',
    ];

    if (userRole === 'admin' || userRole === 'caregiver') {
      return [...commonQuestions, ...adminQuestions];
    }

    return commonQuestions;
  }

  /**
   * Guarda el historial de chat en sessionStorage
   */
  saveHistory(messages: ChatMessage[], userId?: string | number): void {
    if (!userId) return;
    try {
      sessionStorage.setItem(`chat_history_${userId}`, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  /**
   * Recupera el historial de chat desde sessionStorage
   */
  loadHistory(userId?: string | number): ChatMessage[] {
    if (!userId) return [];
    try {
      const history = sessionStorage.getItem(`chat_history_${userId}`);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }

  /**
   * Limpia el historial de chat local y del servidor
   */
  clearHistory(userId?: string | number): Observable<any> {
    if (userId) {
      try {
        sessionStorage.removeItem(`chat_history_${userId}`);
      } catch (error) {
        console.error('Error clearing local chat history:', error);
      }
    }
    // Also clear from server
    return this.http.delete(`${this.apiUrl}/chat/history`);
  }
}
