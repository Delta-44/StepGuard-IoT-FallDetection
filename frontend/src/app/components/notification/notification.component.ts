import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (notificationService.activeNotification()) {
      <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
          
          <!-- Header -->
          <div 
            class="px-5 py-4 flex items-center gap-3"
            [ngClass]="{
              'bg-green-50 border-b border-green-100': notificationService.activeNotification()?.type === 'success',
              'bg-red-50 border-b border-red-100': notificationService.activeNotification()?.type === 'error',
              'bg-orange-50 border-b border-orange-100': notificationService.activeNotification()?.type === 'warning',
              'bg-blue-50 border-b border-blue-100': notificationService.activeNotification()?.type === 'info' || notificationService.activeNotification()?.type === 'confirm'
            }"
          >
            <div 
              class="p-2 rounded-lg"
              [ngClass]="{
                'bg-green-100 text-green-600': notificationService.activeNotification()?.type === 'success',
                'bg-red-100 text-red-600': notificationService.activeNotification()?.type === 'error',
                'bg-orange-100 text-orange-600': notificationService.activeNotification()?.type === 'warning',
                'bg-blue-100 text-blue-600': notificationService.activeNotification()?.type === 'info' || notificationService.activeNotification()?.type === 'confirm'
              }"
            >
              @if (notificationService.activeNotification()?.type === 'success') {
                <i-lucide name="check-circle" [size]="24"></i-lucide>
              } @else if (notificationService.activeNotification()?.type === 'error') {
                <i-lucide name="x-circle" [size]="24"></i-lucide>
              } @else if (notificationService.activeNotification()?.type === 'warning') {
                <i-lucide name="alert-triangle" [size]="24"></i-lucide>
              } @else {
                <i-lucide name="info" [size]="24"></i-lucide>
              }
            </div>
            
            <div class="flex-1">
              <h3 
                class="font-semibold text-sm"
                [ngClass]="{
                  'text-green-900': notificationService.activeNotification()?.type === 'success',
                  'text-red-900': notificationService.activeNotification()?.type === 'error',
                  'text-orange-900': notificationService.activeNotification()?.type === 'warning',
                  'text-blue-900': notificationService.activeNotification()?.type === 'info' || notificationService.activeNotification()?.type === 'confirm'
                }"
              >
                {{ notificationService.activeNotification()?.title }}
              </h3>
            </div>

            @if (notificationService.activeNotification()?.type !== 'confirm') {
              <button 
                (click)="notificationService.close()"
                class="p-1 hover:bg-black/5 rounded transition-colors text-gray-400 hover:text-gray-600"
              >
                <i-lucide name="x" [size]="18"></i-lucide>
              </button>
            }
          </div>

          <!-- Body -->
          @if (notificationService.activeNotification()?.message) {
            <div class="px-5 py-4">
              <p class="text-sm text-gray-600">{{ notificationService.activeNotification()?.message }}</p>
            </div>
          }

          <!-- Footer (solo para confirm) -->
          @if (notificationService.activeNotification()?.type === 'confirm') {
            <div class="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button 
                (click)="notificationService.activeNotification()?.onCancel?.()"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                (click)="notificationService.activeNotification()?.onConfirm?.()"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Aceptar
              </button>
            </div>
          }

        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scale-in {
      from { 
        opacity: 0;
        transform: scale(0.95);
      }
      to { 
        opacity: 1;
        transform: scale(1);
      }
    }

    .animate-fade-in {
      animation: fade-in 0.2s ease-out;
    }

    .animate-scale-in {
      animation: scale-in 0.2s ease-out;
    }
  `]
})
export class NotificationComponent {
  notificationService = inject(NotificationService);
}
