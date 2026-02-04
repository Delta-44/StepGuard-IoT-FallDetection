/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Capa de Estabilidad - Interfaz Base
        primary: {
          DEFAULT: '#0D6EFD', // Azul Real - Navegación y estructura
          light: '#3D8BFD',
          dark: '#0A58CA',
        },
        // Estados del Dispositivo
        emergency: {
          DEFAULT: '#DC3545', // Rojo Intenso - SOLO para caídas detectadas
          light: '#E4606D',
          dark: '#B02A37',
        },
        operational: {
          DEFAULT: '#198754', // Verde Esmeralda - Conexión exitosa
          light: '#20C997',
          dark: '#146C43',
        },
        preventive: {
          DEFAULT: '#FFC107', // Ámbar - Advertencias técnicas
          light: '#FFD43B',
          dark: '#CC9A06',
        },
        // Neutrales para accesibilidad
        base: {
          bg: '#F8F9FA', // Gris Muy Claro - Fondo principal
          text: '#212529', // Gris Casi Negro - Máximo contraste AAA
          border: '#DEE2E6',
        },
        // Para gráficas de aceleración
        chart: {
          zAxis: '#0D6EFD', // Azul - Eje Z (gravedad)
          xyAxis: '#00B4D8', // Cian - Ejes X e Y
          grid: '#E9ECEF',
        },
      },
      keyframes: {
        // Animación de pulso para alertas críticas
        'pulse-emergency': {
          '0%, 100%': { 
            opacity: '1',
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(220, 53, 69, 0.7)',
          },
          '50%': { 
            opacity: '0.9',
            transform: 'scale(1.05)',
            boxShadow: '0 0 0 10px rgba(220, 53, 69, 0)',
          },
        },
        // Animación de respiración para estado operativo
        'breathe': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        // Slide in desde arriba para notificaciones
        'slide-down': {
          '0%': { 
            transform: 'translateY(-100%)',
            opacity: '0',
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        // Fade in suave
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // Shake para alertas
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        // Glow para indicadores activos
        'glow': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(25, 135, 84, 0.5)',
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(25, 135, 84, 0.8), 0 0 30px rgba(25, 135, 84, 0.6)',
          },
        },
      },
      animation: {
        'pulse-emergency': 'pulse-emergency 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-in',
        'shake': 'shake 0.5s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
