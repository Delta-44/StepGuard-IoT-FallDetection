import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  public activeNotification = signal<Notification | null>(null);

  success(title: string, message: string = '') {
    this.show({
      id: this.generateId(),
      type: 'success',
      title,
      message
    });
  }

  error(title: string, message: string = '') {
    this.show({
      id: this.generateId(),
      type: 'error',
      title,
      message
    });
  }

  warning(title: string, message: string = '') {
    this.show({
      id: this.generateId(),
      type: 'warning',
      title,
      message
    });
  }

  info(title: string, message: string = '') {
    this.show({
      id: this.generateId(),
      type: 'info',
      title,
      message
    });
  }

  confirm(title: string, message: string = ''): Promise<boolean> {
    return new Promise((resolve) => {
      this.show({
        id: this.generateId(),
        type: 'confirm',
        title,
        message,
        onConfirm: () => {
          this.close();
          resolve(true);
        },
        onCancel: () => {
          this.close();
          resolve(false);
        }
      });
    });
  }

  private show(notification: Notification) {
    this.activeNotification.set(notification);
    
    // Auto-cerrar después de 4 segundos (excepto confirm)
    if (notification.type !== 'confirm') {
      setTimeout(() => this.close(), 4000);
    }
  }

  close() {
    this.activeNotification.set(null);
  }

  private generateId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
