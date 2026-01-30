import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'severityLabel',
  standalone: true
})
export class SeverityLabelPipe implements PipeTransform {

  transform(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨 EMERGENCIA';
      case 'medium': return '⚠️ Advertencia';
      case 'low': return 'ℹ️ Info';
      default: return severity;
    }
  }
}