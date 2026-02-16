import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Signal para gestionar el estado del tema
  themeSignal = signal<string>('light');
  
  // Storage key
  private readonly THEME_KEY = 'theme-preference';

  constructor() {
    this.initTheme();
    
    // Effect para sincronizar cambios si es necesario, 
    // aunque setTheme ya maneja la lógica principal.
  }

  private initTheme() {
    // 1. Check persistence
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme) {
      this.setTheme(savedTheme);
      return;
    }

    // 2. Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }
  }

  setTheme(theme: string) {
    this.themeSignal.set(theme);
    localStorage.setItem(this.THEME_KEY, theme);
    
    // Update HTML attribute for Tailwind or CSS selectors
    document.documentElement.setAttribute('data-theme', theme);
    
    // Toggle class for Tailwind 'darkMode: class' strategy if used
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggleTheme() {
    const current = this.themeSignal();
    this.setTheme(current === 'light' ? 'dark' : 'light');
  }
}
