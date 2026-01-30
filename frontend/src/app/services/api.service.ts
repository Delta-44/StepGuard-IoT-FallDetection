import { Injectable } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Alert } from '../models/alert.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor() { }

  getAlertsStream(): Observable<Alert[]> {
    return timer(0, 3000).pipe(
      switchMap(() => {
        return of(this.generateMockData()); 
      })
    );
  }

  markAsResolved(alertId: string): Observable<boolean> {
    console.log(`Lógica: Enviando petición al backend para resolver alerta ${alertId}...`);
    return of(true);
  }

  private generateMockData(): Alert[] {
    return [
      {
        id: '1',
        deviceId: 'ESP32-001',
        timestamp: new Date(),
        severity: 'critical',
        description: 'Caída detectada en Salón',
        resolved: false
      },
      {
        id: '2',
        deviceId: 'ESP32-002',
        timestamp: new Date(Date.now() - 600000),
        severity: 'medium',
        description: 'Inactividad prolongada',
        resolved: true
      }
    ];
  }
}
