import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Device } from '../../models/device';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DevicesComponent implements OnInit {

  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  public devices = signal<Device[]>([]);
  public isLoading = signal<boolean>(true);
  public showTechnicalPanel = signal<boolean>(true);
  public connectionStatus = signal<'Conectado' | 'Desconectado'>('Conectado');
  public criticalState = signal<boolean>(false);

  public isAdmin = computed(() => this.authService.currentUser()?.role === 'admin');

  ngOnInit(): void {
    this.loadDevices();
  }

  trackDeviceById(index: number, device: Device): string {
    return device.id || index.toString();
  }

  public loadDevices(): void {
    this.isLoading.set(true);
    this.connectionStatus.set('Conectado');
    this.apiService.getDevices().subscribe({
      next: (data) => {
        this.devices.set(data);
        const hasCritical = data.some(d => d.sensorData?.fallDetected || d.status === 'offline');
        this.criticalState.set(hasCritical);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando dispositivos:', err);
        this.connectionStatus.set('Desconectado');
        this.isLoading.set(false);
      }
    });
  }

  public toggleTechnicalPanel(): void {
    this.showTechnicalPanel.set(!this.showTechnicalPanel());
  }

  // ACCIÓN SOLO PARA ADMINS
  public rebootDevice(device: Device): void {
    // 1. Candado de seguridad (Lógica)
    if (!this.isAdmin()) {
      alert('⛔ ACCESO DENEGADO: Solo los administradores pueden reiniciar equipos.');
      return;
    }

    // 2. Confirmación visual
    if (!confirm(`¿Reiniciar el sensor "${device.name}" en ${device.location}?`)) return;

    // 3. Llamada al servicio (Simulada)
    this.apiService.toggleDevice(device.id).subscribe(() => {
      alert(`✅ Comando de reinicio enviado a ${device.name}`);
    });
  }
}