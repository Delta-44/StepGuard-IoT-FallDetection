import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode = signal<boolean>(false);

  constructor() {
    // Cargar preferencia guardada o usar preferencia del sistema
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.isDarkMode.set(savedTheme === 'dark' || (!savedTheme && prefersDark));
    this.applyTheme();
  }

  toggleTheme() {
    this.isDarkMode.update(value => !value);
    console.log('🌓 Tema cambiado a:', this.isDarkMode() ? 'OSCURO' : 'CLARO');
    this.applyTheme();
  }

  private applyTheme() {
    const isDark = this.isDarkMode();
    console.log('🎨 Aplicando tema:', isDark ? 'dark' : 'light');
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    console.log('✅ Clase dark en html:', document.documentElement.classList.contains('dark'));
  }
}
