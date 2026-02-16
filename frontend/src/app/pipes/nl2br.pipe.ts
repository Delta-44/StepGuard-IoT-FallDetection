import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'nl2br',
  standalone: true,
})
export class Nl2brPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';
    
    // Convertir saltos de línea a <br>
    const htmlText = value
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Soporte para **negrita**
      .replace(/\*(.*?)\*/g, '<em>$1</em>'); // Soporte para *cursiva*
    
    return this.sanitizer.sanitize(1, htmlText) || '';
  }
}
