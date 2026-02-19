export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api', // Backend API local
  useMockAlerts: false,
  
  // ====================================================
  // GRAFANA CLOUD - Configuración
  // ====================================================
  // Reemplaza con tu URL de Grafana Cloud
  // Ejemplo: https://stepguard.grafana.net
  // 
  // IMPORTANTE: NO incluyas el path del dashboard aquí,
  // solo la URL base de tu stack de Grafana Cloud.
  // El componente analytics agregará el path automáticamente.
  grafanaUrl: 'https://TUNOMBRE.grafana.net',
  
  // MAC Address de tu dispositivo físico StepGuard
  realESP32Mac: 'EC:E3:34:DA:1C:08'
};

// ====================================================
// PASOS PARA CONFIGURAR:
// ====================================================
// 1. Crea cuenta gratuita en: https://grafana.com/auth/sign-up/create-user
// 2. Obtén tu URL de stack: https://TUNOMBRE.grafana.net
// 3. Configura datasource de Neon (ver: backend/monitoring/GRAFANA_CLOUD_SETUP.md)
// 4. Importa dashboard desde: backend/monitoring/grafana/provisioning/dashboards/stepguard-general-v2.json
// 5. Obtén el UID del dashboard de la URL
// 6. Actualiza analytics.component.ts con el UID correcto
