export const environment = {
  production: true,
    // apiUrl: 'http://localhost:3000/api', // La base de tus endpoints (NO USAR localhost en producción)
  apiUrl: 'https://stepguard-backend.onrender.com/api', // ⚠️ Actualizar con tu URL real de Render
  grafanaUrl: 'https://delta44.grafana.net', // Grafana Cloud
  useMockAlerts: false,
  
  // 🔴 CONFIGURACIÓN DE TU ESP32 REAL
  // MAC Address de tu dispositivo físico StepGuard
  realESP32Mac: 'EC:E3:34:DA:1C:08'
};
