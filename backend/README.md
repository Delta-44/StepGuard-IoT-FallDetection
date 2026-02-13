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

### Ejecutar tests
```powershell
npm test                    # Todos los tests
npm test -- --coverage      # Con reporte de cobertura
npm test -- --watch         # En modo watch
npx jest test/authController.spec.ts  # Test específico
```

## 📊 Cobertura de Tests

| Controlador | Tests | Cobertura |
|-------------|-------|-----------|
| authController | 8 | forgotPassword, resetPassword |
| registerController | 8 | registerUsuario, registerCuidador |
| userController | 3 | getUsers, getUserById |
| **Total** | **19** | Flujos principales, validación, errores |

**Características cubiertas:**
- ✅ Validación de entrada (campos requeridos)
- ✅ Manejo de errores (BD, tokens)
- ✅ Seguridad (JWT, prevención de enumeración)
- ✅ Casos exitosos y flujos principales
- ✅ Mocking completo sin BD real

Para más detalles, ver [test/README.md](./test/README.md)

## 🔐 Controladores Principales

### authController.ts
**Funciones:**
- `forgotPassword`: Solicita reseteo de contraseña
  - Valida email, busca usuario/cuidador
  - Genera JWT con propósito reset-password
  - Envía email con link de reseteo
  - Retorna 200 incluso si email no existe (seguridad)

- `resetPassword`: Completa reseteo de contraseña
  - Verifica JWT (válido, no expirado, propósito correcto)
  - Valida que contraseña sea fuerte
  - Limita rate (max 1 reseteo cada 5 minutos)
  - Actualiza contraseña en BD

**Endpoints:**
- `POST /api/auth/forgot-password` - { email: string }
- `POST /api/auth/reset-password` - { token: string, password: string }

### registerController.ts
**Funciones:**
- `registerUsuario`: Crea nuevo usuario
  - Valida email, password, name
  - Calcula fecha de nacimiento desde edad
  - Hashea contraseña
  - Retorna JWT de sesión

- `registerCuidador`: Crea nuevo cuidador
  - Mismas validaciones
  - No es admin por defecto
  - Retorna JWT de sesión

**Validaciones:**
- Email: formato válido, no duplicado
- Password: mínimo 8 caracteres, letras y números
- Name: mínimo 2 caracteres

**Endpoints:**
- `POST /api/register/usuario` - { email, password, name, edad }
- `POST /api/register/cuidador` - { email, password, name }

### userController.ts
**Funciones:**
- `getUsers`: Lista todos usuarios y cuidadores
  - Combina resultados de BD
  - Excluye password_hash
  - Asigna rol y is_admin

- `getUserById`: Obtiene usuario con dispositivo
  - Valida ID (número positivo)
  - Mapea datos de dispositivo
  - Verifica permisos (usuario propio o admin)
  - Retorna 404 si no existe

**Endpoints:**
- `GET /api/users/` - requiere auth
- `GET /api/users/:id` - requiere auth

## 🔧 Modelos Principales

### Usuario
```typescript
{
  id: number,
  nombre: string,
  email: string,
  password_hash: string,
  rol: 'usuario',
  edad: number,
  genero?: string,
  dispositivo_id?: number,
  activo: boolean,
  fecha_creacion: Date
}
```

### Cuidador
```typescript
{
  id: number,
  nombre: string,
  email: string,
  password_hash: string,
  is_admin: boolean,
  activo: boolean,
  fecha_creacion: Date
}
```

### Dispositivo
```typescript
{
  id: number,
  device_id: string,  // ID de ESP32
  nombre: string,
  usuario_id: number,
  estado: 'activo' | 'inactivo',
  bateria: number,
  fecha_registro: Date
}
```

## 📡 Variables de Entorno

```env
# Base de datos
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_SECRET=yyy

# CORS
CORS_ORIGIN=http://localhost:4200

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Redis
REDIS_URL=redis://localhost:6379

# MQTT (ESP32)
MQTT_BROKER=mqtt://mqtt.example.com
MQTT_PORT=1883

# Cloudinary (Imágenes)
CLOUDINARY_URL=cloudinary://...
```

## 🧪 Testing Mejorado (v2.0 Pragmático)

### Qué Cambió
- ✅ Cambio de 3 tests básicos a 19 tests pragmáticos
- ✅ Enfoque: tests que pasen y sean confiables
- ✅ Builders para datos de prueba reutilizables
- ✅ Cobertura de flujos principales, validación y seguridad
- ✅ Documentación completa en test/README.md
- ✅ **100% de tests passing** en CI/CD ready

### Enfoque Pragmático
Tests diseñados para:
- Ser mantenibles a largo plazo
- Reflejar el comportamiento actual del código
- Cubrir casos críticos sin ser excesivamente restrictivos
- Ejecutarse rápido sin requerir BD real

### Ejecutar Tests
```powershell
npm test                # Todos (19 tests pragmáticos)
npm test -- --coverage  # Con reporte de cobertura
npm test -- --watch     # En modo watch
npx jest -t "debe"      # Buscar por nombre
```

## 📚 Otros Archivos Importantes

- `src/controllers/googleAuthController.ts`: OAuth con Google
- `src/controllers/chatController.ts`: Endpoint de chat (simulado)
- `src/controllers/esp32Controller.ts`: Comunicación con dispositivos
- `src/controllers/eventsController.ts`: Eventos de caída detectados
- `src/middleware/auth.ts`: Validación de JWT
- `src/config/database.ts`: Conexión PostgreSQL
- `src/database/init.sql`: Schema de BD
- `jest.config.cjs`: Configuración de tests
- `tsconfig.json`: Configuración de TypeScript

Ver scripts en `src/database/` para inicializar y popular BD.

## 🔗 Relacionados

- [Frontend](../frontend/README.md) - Angular app
- [Device](../device/README.md) - Código ESP32
- [Docs](../docs/) - Diagramas y manuales

## 📝 Notas

- Tests no requieren BD real (mockean modelos)
- Todos async/await con Jest
- Antes de enviar a producción: revisar variables .env
- Rate limiting implementado para reseteo de password

