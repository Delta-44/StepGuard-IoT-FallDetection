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
    console.log('🎨 ThemeService: Initializing...');
    
    // 1. Check persistence
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    console.log('💾 Saved theme from localStorage:', savedTheme);
    
    if (savedTheme) {
      this.setTheme(savedTheme);
      return;
    }

    // 2. Check system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.log('🖥️ System prefers dark mode:', prefersDark);
    
    if (prefersDark) {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }
  }

  setTheme(theme: string) {
    console.log('🎨 Setting theme to:', theme);
    console.log('📍 Current HTML element:', document.documentElement);
    
    this.themeSignal.set(theme);
    localStorage.setItem(this.THEME_KEY, theme);
    
    // Update HTML attribute for Tailwind or CSS selectors
    document.documentElement.setAttribute('data-theme', theme);
    
    // Toggle class for Tailwind 'darkMode: class' strategy if used
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('✅ Dark mode activated');
      console.log('📋 HTML classList after adding dark:', document.documentElement.classList.toString());
      console.log('🔍 Has dark class?', document.documentElement.classList.contains('dark'));
    } else {
      document.documentElement.classList.remove('dark');
      console.log('✅ Light mode activated');
      console.log('📋 HTML classList after removing dark:', document.documentElement.classList.toString());
    }
  }

  toggleTheme() {
    const current = this.themeSignal();
    const newTheme = current === 'light' ? 'dark' : 'light';
    console.log('🔄 Toggling theme from', current, 'to', newTheme);
    this.setTheme(newTheme);
  }
}
