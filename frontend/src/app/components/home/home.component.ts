import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="main-container">
      
      <div class="circle-bg"></div>

      <div class="content-wrapper">
        
        <div class="logo-container">
          <span class="logo-icon">🎯</span>
        </div>

        <h1 class="app-title">StepGuard <span class="text-gradient">IoT</span></h1>
        <p class="app-subtitle">Sistema Inteligente de Detección de Caídas</p>

        <div class="welcome-card">
          <div class="user-avatar">
            {{ getInitials(userName()) }}
          </div>
          
          <h2>¡Hola, {{ userName() }}!</h2>
          <p class="status-text">✅ El sistema está activo y funcionando.</p>
          
          <a routerLink="/dashboard" class="action-button">
            Ir a Monitorización 📊
          </a>
        </div>

      </div>

      <div class="footer">
        v1.0.0 • Proyecto Académico
      </div>
    </div>
  `,
  styles: [`
    /* --- ESTRUCTURA PRINCIPAL --- */
    .main-container {
      min-height: 90vh; /* Ocupa casi toda la pantalla */
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); /* Degradado gris-azulado */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', sans-serif;
      position: relative;
      overflow: hidden;
    }

    /* Círculo decorativo en el fondo */
    .circle-bg {
      position: absolute;
      top: -100px; right: -100px;
      width: 300px; height: 300px;
      background: rgba(0, 123, 255, 0.1);
      border-radius: 50%;
      z-index: 0;
    }

    .content-wrapper {
      position: relative;
      z-index: 1; /* Para que esté encima del fondo */
      text-align: center;
      animation: slideUp 0.8s ease-out;
    }

    /* --- LOGO MEJORADO --- */
    .logo-container {
      background: white;
      width: 100px; height: 100px;
      border-radius: 25px; /* Bordes redondeados tipo iOS */
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px auto; /* Centrado y separado del texto */
      box-shadow: 0 10px 25px rgba(0,0,0,0.1); /* Sombra elegante */
      font-size: 50px;
    }

    .app-title {
      font-size: 2.5rem;
      font-weight: 800;
      color: #2c3e50;
      margin: 0;
      letter-spacing: -1px;
    }

    .text-gradient {
      background: linear-gradient(45deg, #ff4444, #ff8888);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .app-subtitle {
      color: #666;
      font-size: 1.1rem;
      margin-top: 5px;
      margin-bottom: 40px;
    }

    /* --- TARJETA DE USUARIO --- */
    .welcome-card {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px); /* Efecto cristal */
      padding: 30px;
      border-radius: 20px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.05);
      width: 300px;
      margin: 0 auto;
      display: flex; flex-direction: column; align-items: center;
    }

    /* Círculo con iniciales del usuario */
    .user-avatar {
      background: #2c3e50;
      color: white;
      width: 50px; height: 50px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: bold;
      font-size: 1.2rem;
      margin-bottom: 15px;
    }

    .welcome-card h2 {
      margin: 0; font-size: 1.4rem; color: #333;
    }

    .status-text {
      color: #28a745; font-size: 0.9rem; margin-bottom: 25px;
    }

    /* --- BOTÓN PRINCIPAL --- */
    .action-button {
      background: #007bff; /* Azul profesional */
      color: white;
      text-decoration: none;
      padding: 12px 25px;
      border-radius: 50px; /* Botón píldora */
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
      transition: all 0.3s ease;
      display: block; width: 100%; box-sizing: border-box;
    }

    .action-button:hover {
      background: #0056b3;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
    }

    .footer {
      margin-top: 50px; color: #aaa; font-size: 0.8rem;
    }

    /* Animación de entrada */
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class HomeComponent {
  private authService = inject(AuthService);
  public userName = computed(() => this.authService.currentUser()?.fullName || 'Usuario');

  // Función para sacar las iniciales (Ej: Juan Perez -> JP)
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}