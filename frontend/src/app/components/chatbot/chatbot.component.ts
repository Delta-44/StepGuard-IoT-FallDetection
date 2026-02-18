import { Component, signal, inject, effect, ChangeDetectorRef } from '@angular/core';
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
export class ChatbotComponent {
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

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
      const userId = this.currentUser()?.id;
      if (msgs.length > 1 && userId) { 
        this.chatService.saveHistory(msgs, userId);
      }
    });

    // Cargar historial inicial si ya hay usuario
    effect(() => {
      const user = this.currentUser();
      if (user?.id) {
        this.loadChatForUser(user.id);
      }
    }, { allowSignalWrites: true });
  }

  private loadChatForUser(userId: string | number): void {
    // console.log('[Chatbot] Loading chat for user:', userId);
    const history = this.chatService.loadHistory(userId);
    
    if (history.length > 0) {
      // console.log('[Chatbot] Restoring history:', history.length);
      this.messages.set(history);
    } else {
      // console.log('[Chatbot] No history, showing welcome.');
      this.addWelcomeMessage();
    }
    
    this.loadSuggestedQuestions();
    this.cdr.detectChanges();
    setTimeout(() => this.scrollToBottom(), 50);
  }

  toggleChat(): void {
    this.isOpen.update((val) => !val);
    
    if (this.isOpen()) {
      // Al abrir, asegurarnos de que hay mensajes si el usuario está logueado
      const user = this.currentUser();
      if (user?.id && this.messages().length === 0) {
        this.loadChatForUser(user.id);
      }

      this.cdr.detectChanges();
      setTimeout(() => {
        this.scrollToBottom();
        this.cdr.detectChanges(); // Check one more time after scroll/animation
      }, 100);
    }
  }

  closeChat(): void {
    this.isOpen.set(false);
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
    const userId = this.currentUser()?.id;
    if (userId) {
      // Llamar al backend y limpiar localmente al finalizar
      this.chatService.clearHistory(userId).subscribe({
        next: () => {
          console.log('[Chatbot] Historial borrado en servidor y local');
          this.messages.set([]);
          this.addWelcomeMessage();
        },
        error: (err) => {
          console.error('[Chatbot] Error borrando historial:', err);
          // Aún así limpiamos localmente para feedback inmediato
          this.messages.set([]);
          this.addWelcomeMessage();
        }
      });
    } else {
      // Solo local si no hay usuario (caso raro)
      this.messages.set([]);
      this.addWelcomeMessage();
    }
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
