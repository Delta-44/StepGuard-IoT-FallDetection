Backend — Documentación

## Resumen

API Express en TypeScript que gestiona autenticación, registro, recuperación de contraseña, usuarios y dispositivos IoT. Incluye suite pragmática de 19 tests unitarios con Jest, 100% passing.

## ✨ Características Principales

- **Autenticación Segura**: Recuperación y reseteo de contraseña con JWT
- **Registro de Usuarios**: Soporte para usuarios y cuidadores
- **Gestión de Dispositivos**: Sincronización con ESP32 y monitoreo
- **Tests Unitarios**: 19 tests pragmáticos con cobertura de flujos principales
- **Mocking Completo**: Tests sin dependencia de BD real
- **TypeScript**: Código tipado y seguro

## 📁 Estructura Principal

```
src/
├── controllers/         # Lógica de endpoints
├── routes/             # Definición de rutas
├── models/             # Modelos de BD (Usuario, Cuidador, etc.)
├── middleware/         # Auth, upload, etc.
├── services/           # Servicios auxiliares
├── config/             # Configuración (BD, MQTT, Redis, Cloudinary)
├── database/           # Scripts de inicialización
└── scripts/            # Utilidades varias

test/
├── authController.spec.ts      # 8 tests pragmáticos de autenticación
├── registerController.spec.ts  # 8 tests pragmáticos de registro
├── userController.spec.ts      # 3 tests pragmáticos de gestión de usuarios
├── utils/
│   └── mockRequestResponse.ts  # Builders y utilidades
└── mocks/
    └── database.ts             # Mock de BD
```

## 🚀 Instalación y Ejecución

### Instalar dependencias
```powershell
cd backend
npm install
```

### Ejecutar servidor
```powershell
npm run dev
```

- JWT_SECRET: clave para firmar JWT (se usa en controladores).
- GOOGLE_CLIENT_ID, GOOGLE_SECRET: clientes Google OAuth en googleAuthController.
- CORS_ORIGIN: frontend base URL usada para generar links de reset.
- GRAFANA_ADMIN_USER, GRAFANA_ADMIN_PASSWORD: credenciales de administrador de Grafana (opcional, por defecto: admin/admin123).

## 📊 Monitoreo con Grafana

El proyecto incluye **Grafana** para visualización y monitoreo en tiempo real de:
- Eventos de caídas detectadas
- Estado de dispositivos ESP32
- Notificaciones y alertas
- Auditoría del sistema

### Acceso rápido

Después de levantar los servicios con `docker-compose up -d`:

- **URL:** http://localhost:3000
- **Usuario:** `admin`
- **Contraseña:** `admin123`

### Dashboards disponibles

1. **Dashboard General** - Vista general del sistema con KPIs principales
2. **Análisis de Caídas** - Estadísticas detalladas de eventos de caída
3. **Monitoreo de Dispositivos** - Estado y conectividad de ESP32
4. **Notificaciones** - Seguimiento de alertas enviadas

### Documentación completa

Ver [GRAFANA.md](../GRAFANA.md) para:
- Guía de instalación y configuración
- Descripción detallada de cada dashboard
- Casos de uso y mejores prácticas
- Personalización y alertas
- Troubleshooting

### Configuración

Los dashboards y datasources se configuran automáticamente mediante provisioning en:
- `grafana/provisioning/datasources/` - Conexión a PostgreSQL
- `grafana/provisioning/dashboards/` - Configuración de dashboards
- `grafana/dashboards/` - Archivos JSON de los dashboards

