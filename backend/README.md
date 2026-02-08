Backend — Documentación

Resumen: API Express en TypeScript que gestiona autenticación, registro, recuperación de contraseña y usuarios. A continuación se documentan brevemente los ficheros principales en src/ y cómo ejecutar los tests existentes sin modificar código.

Estructura y archivos relevantes

- src/controllers/authController.ts: Maneja recuperación y reseteo de contraseña.
  - Endpoints esperados: POST /api/auth/forgot-password (body: { email }), POST /api/auth/reset-password (body: { token, password }).
  - Lógica clave: busca usuario en UsuarioModel o CuidadorModel, genera JWT con propósito reset-password, valida password_last_changed_at antes de aceptar reseteo.

- src/controllers/googleAuthController.ts: Flujo de autenticación con Google.
  - Funciones: googleAuthRedirect, googleAuthCallback, googleLogin.
  - Lógica: verifica idToken con google-auth-library, busca o crea Usuario/Cuidador, genera JWT de sesión.

- src/controllers/registerController.ts: Endpoints para registro de usuario y cuidador.
  - registerUsuario: valida campos, calcula fecha_nacimiento a partir de edad si procede, hashea la contraseña y crea usuario.
  - registerCuidador: valida campos, hashea contraseña y crea cuidador.

- src/controllers/userController.ts:
  - getUsers: devuelve lista combinada de usuarios y cuidadores sin hashes de password.
  - getUserById: devuelve usuario con datos del dispositivo (si existe) en una estructura limpia.

- src/models/usuario.ts y src/models/cuidador.ts:
  - Modelos con métodos CRUD y helpers (findByEmail, create, updatePassword, findAll, etc.).
  - Interaccionan con la BD mediante query desde src/config/database.

- src/routes/userRoutes.ts:
  - Rutas protegidas que utilizan auth middleware: GET /api/users/ y GET /api/users/:id.

- Scripts de ayuda / tests (no requieren cambios de código):
  - src/check-test-user.ts: script que comprueba/crea un usuario de prueba en BD.
  - src/test-jwt-password-reset.ts: script de pruebas de integración (usa axios) para el flujo de recuperación de contraseña.
  - src/test-unified-auth.ts: script con supertest que monta una app express y prueba registros y login.
  - src/test-user-endpoint.ts: script con supertest que prueba endpoints de usuario y obtención de info de dispositivo.

Variables de entorno relevantes

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

