import { Component, signal, inject, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Nl2brPipe } from '../../pipes/nl2br.pipe';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, Nl2brPipe],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
})
export class ChatbotComponent implements OnInit {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);

  // Estado del chatbot
  isOpen = signal(false);
  messages = signal<ChatMessage[]>([]);
  inputMessage = signal('');
  isTyping = signal(false);
  suggestedQuestions = signal<string[]>([]);

  currentUser = this.authService.currentUser;

  constructor() {
    // Guardar historial cuando cambian los mensajes
    effect(() => {
      const msgs = this.messages();
      if (msgs.length > 1) { // No guardar solo el mensaje de bienvenida
        this.chatService.saveHistory(msgs);
      }
    });
  }

  ngOnInit(): void {
    // Inicializar contenido de forma inmediata
    setTimeout(() => {
      const history = this.chatService.loadHistory();
      if (history.length > 0) {
        this.messages.set(history);
      } else {
        this.addWelcomeMessage();
      }
      this.loadSuggestedQuestions();
    }, 0);
  }

  private addWelcomeMessage(): void {
    const welcomeMsg: ChatMessage = {
      id: this.generateId(),
      text: `¡Hola ${this.currentUser()?.fullName || 'Usuario'}! 👋\n\nSoy tu asistente virtual de StepGuard IoT. Puedo ayudarte con:\n\n• Estado de dispositivos\n• Estadísticas de caídas\n• Información de pacientes\n• Telemetría en tiempo real\n\n¿En qué puedo ayudarte hoy?`,
      sender: 'bot',
      timestamp: new Date(),
    };
    this.messages.set([welcomeMsg]);
  }

  private loadSuggestedQuestions(): void {
    const role = this.currentUser()?.role;
    this.suggestedQuestions.set(this.chatService.getSuggestedQuestions(role));
  }

  toggleChat(): void {
    this.isOpen.update((val) => !val);
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  async sendMessage(messageText?: string): Promise<void> {
    const text = messageText || this.inputMessage().trim();
    
    if (!text) return;

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: this.generateId(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    this.messages.update((msgs) => [...msgs, userMessage]);
    this.inputMessage.set('');
    this.isTyping.set(true);

    // Scroll al final
    setTimeout(() => this.scrollToBottom(), 100);

    try {
      // Llamar al backend
      const response = await this.chatService.sendMessage(text).toPromise();

      // Agregar respuesta del bot
      const botMessage: ChatMessage = {
        id: this.generateId(),
        text: response?.reply || 'Lo siento, no pude procesar tu solicitud.',
        sender: 'bot',
        timestamp: new Date(),
      };

      this.messages.update((msgs) => [...msgs, botMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);

      // Mensaje de error
      const errorMessage: ChatMessage = {
        id: this.generateId(),
        text: 'Disculpa, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        sender: 'bot',
        timestamp: new Date(),
      };

      this.messages.update((msgs) => [...msgs, errorMessage]);
    } finally {
      this.isTyping.set(false);
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  useSuggestedQuestion(question: string): void {
    this.sendMessage(question);
  }

  clearChat(): void {
    this.messages.set([]);
    this.chatService.clearHistory();
    this.addWelcomeMessage();
  }

  private scrollToBottom(): void {
    const chatBody = document.querySelector('.chatbot-messages');
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  }

  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  formatTime(date: Date): string {
    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;

    return messageDate.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    });
  }

  trackMessageById(index: number, message: ChatMessage): string {
    return message.id;
  }

  handleKeyDown(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    keyEvent.preventDefault();
    
    // Si Shift está presionado, permite salto de línea
    if (keyEvent.shiftKey) {
      const textarea = keyEvent.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = this.inputMessage();
      
      this.inputMessage.set(value.substring(0, start) + '\n' + value.substring(end));
      
      // Restaurar posición del cursor
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    } else {
      // Si no está Shift presionado, enviar mensaje
      this.sendMessage();
    }
  }
}
