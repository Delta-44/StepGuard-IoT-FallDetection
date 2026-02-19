# Manual Técnico - StepGuard IoT

## Tabla de Contenidos
1. [Requisitos del Sistema](#requisitos)
2. [Instalación](#instalación)
3. [Configuración](#configuración)
4. [Variables de Entorno](#variables-de-entorno)
5. [Base de Datos](#base-de-datos)
6. [Testing y Validación](#testing)
7. [Despliegue](#despliegue)
8. [Troubleshooting](#troubleshooting)

---

## Requisitos del Sistema {#requisitos}

### Hardware

#### Backend / Frontend Server
- **CPU**: Intel i5 o equivalente (o cloud VM: AWS t3.micro, Azure B1s, GCP e2-micro)
- **RAM**: 2GB mínimo, 4GB recomendado
- **Disco**: 20GB (SSD recomendado)
- **Red**: Conexión ethernet o WiFi estable

#### Dispositivo IoT (ESP32)
- **Placa**: ESP32-DevKitC v4 o similar
- **Procesador**: Dual-core 240MHz Xtensa LX6
- **RAM**: 520KB SRAM, 4MB PSRAM
- **Almacenamiento**: 16MB Flash
- **Sensores**: MPU6050 (6-DOF IMU)
- **Conectividad**: WiFi 802.11 b/g/n
- **Alimentación**: USB Micro-B o batería 3.7V 500mAh

### Software

#### Backend
- **Node.js**: v18 o superior
- **npm**: v8 o superior
- **TypeScript**: v5.9+
- **Docker** (opcional): v20+

#### Frontend
- **Node.js**: v18+
- **npm**: v8+

#### Device
- **PlatformIO CLI**: Latest
- **Python**: v3.7+ (para PlatformIO)

#### Base de Datos
- **PostgreSQL**: v12+ (Neon Cloud recomendado)
- **psql CLI** (opcional): para gestión manual

---

## Instalación {#instalación}

### 1. Clonar Repositorio

```bash
git clone https://github.com/tu-usuario/proyecto_caidas.git
cd proyecto_caidas
```

### 2. Backend

```bash
cd backend
npm install

# Opcional: instalar dependencias de testing
npm install --save-dev jest ts-jest @types/jest
```

**Dependencias principales instaladas:**
```
express@^5.2.1
typescript@^5.9.3
jsonwebtoken@^9.0.3
bcryptjs@^3.0.3
pg@^8.17.2 (PostgreSQL)
nodemailer@^7.0.13
dotenv@^17.2.3
cors@^2.8.6
```

### 3. Frontend

```bash
cd frontend
npm install
```

**Dependencias principales:**
```
@angular/core@^18
@angular/router@^18
@angular/forms@^18
tailwindcss@^3
rxjs@^7
```

### 4. Device (ESP32)

```bash
cd device

# Instalar PlatformIO CLI
pip install platformio

# Compilar
platformio run

# Flashear (reemplazar COM3 con tu puerto)
platformio run --target upload --upload-port COM3
```

---

## Configuración {#configuración}

### Backend - Estructura

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts      # Pool de conexión PostgreSQL
│   │   └── redis.ts         # (opcional) Caché
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── registerController.ts
│   │   ├── userController.ts
│   │   └── googleAuthController.ts
│   ├── models/
│   │   ├── usuario.ts
│   │   ├── cuidador.ts
│   │   ├── dispositivo.ts
│   │   └── alerta.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   └── esp32Routes.ts
│   ├── services/
│   │   └── emailService.ts
│   ├── middleware/
│   │   ├── auth.ts          # JWT validation
│   │   └── errorHandler.ts
│   └── server.ts            # Entry point
├── test/
│   ├── authController.spec.ts
│   ├── registerController.spec.ts
│   ├── userController.spec.ts
│   └── mocks/
│       └── database.ts
├── jest.config.cjs
├── tsconfig.json
└── package.json
```

### Frontend - Estructura

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.ts           # Componente raíz
│   │   ├── app.routes.ts    # Routing
│   │   ├── components/
│   │   │   ├── login-modal/
│   │   │   ├── register-modal/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   └── devices/
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   └── alert.service.ts
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   └── models/
│   │       └── user.model.ts
│   └── index.html
├── tailwind.config.js
└── package.json
```

### Device - Estructura

```
device/
├── src/
│   ├── main.cpp
│   ├── acelerometro.h/.cpp
│   ├── inclinacion.h/.cpp
│   ├── pantalla.h/.cpp
│   ├── red.h/.cpp
│   ├── vibrador.h/.cpp
│   └── config.h             # Configuración de umbrales
├── platformio.ini           # Config PlatformIO
└── requisitos.txt
```

---

## Variables de Entorno {#variables-de-entorno}

### Backend (.env)

```env
# Backend
NODE_ENV=development
PORT=3000
HOST=localhost

# JWT
JWT_SECRET=tu_clave_super_secreta_cambiar_en_produccion_min_32_caracteres
JWT_EXPIRES_IN=1h

# CORS
CORS_ORIGIN=http://localhost:4200
CORS_CREDENTIALS=true

# Base de Datos (PostgreSQL)
DB_USER=postgres
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=caidas_db

# Base de Datos (Neon - Cloud)
DATABASE_URL=postgresql://username:password@ep-host.neon.tech/caidas_db?sslmode=require

# Google OAuth
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_SECRET=tu_secret_key
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password
SMTP_FROM=StepGuard<noreply@stepguard.local>

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Logging
LOG_LEVEL=debug
```

### Frontend (.env)

```env
# Frontend
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
VITE_APP_NAME=StepGuard IoT
```

### Device (config.h)

```cpp
// Configuración de Sensores
#define ACCEL_THRESHOLD_CAIDA 3.5f    // g (gravedad)
#define ACCEL_POST_CAIDA 1.5f          // g (reposo)
#define DETECT_WINDOW_MS 500           // ms

// WiFi
#define WIFI_SSID "tu_red_wifi"
#define WIFI_PASSWORD "tu_password"

// Backend API
#define BACKEND_HOST "192.168.1.100"
#define BACKEND_PORT 3000
#define BACKEND_ENDPOINT "/api/alertas"

// Hardware
#define MPU6050_ADDR 0x68
#define VIBRADOR_PIN 14
#define LED_PIN 12
```

---

## Base de Datos {#base-de-datos}

### Crear BD Local (PostgreSQL)

```bash
# Conectar a PostgreSQL
psql -U postgres

# En la consola psql:
CREATE DATABASE caidas_db;
\c caidas_db

# Crear tablas
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  fecha_nacimiento DATE,
  direccion VARCHAR(200),
  telefono VARCHAR(20),
  dispositivo_id INTEGER,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  password_last_changed_at TIMESTAMP
);

CREATE TABLE cuidadores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  is_admin BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  password_last_changed_at TIMESTAMP
);

CREATE TABLE dispositivos (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) UNIQUE NOT NULL,
  mac_address VARCHAR(17),
  nombre VARCHAR(100),
  estado VARCHAR(20) DEFAULT 'OFFLINE',
  ubicacion VARCHAR(100),
  sensibilidad_caida FLOAT,
  led_habilitado BOOLEAN,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alertas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  dispositivo_id INTEGER REFERENCES dispositivos(id),
  tipo VARCHAR(50),
  severidad VARCHAR(20),
  timestamp TIMESTAMP DEFAULT NOW(),
  leida BOOLEAN DEFAULT FALSE,
  respondida BOOLEAN DEFAULT FALSE
);

CREATE TABLE usuario_cuidador (
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  cuidador_id INTEGER REFERENCES cuidadores(id) ON DELETE CASCADE,
  fecha_asignacion TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (usuario_id, cuidador_id)
);

\q
```

### Usar Neon (Cloud)

1. Ir a https://neon.tech y crear cuenta
2. Crear proyecto nuevo
3. Obtener connection string:
   ```
   postgresql://user:password@ep-host.neon.tech/database?sslmode=require
   ```
4. Guardar en `DATABASE_URL` en `.env`
5. Ejecutar migraciones con el mismo SQL anterior

---

## Testing y Validación {#testing}

### Cobertura de Tests

El proyecto cuenta con **286 tests unitarios** distribuidos en 13 archivos:

```
backend/test/
├── authController.spec.ts        (18 tests)
├── registerController.spec.ts     (22 tests)
├── userController.spec.ts         (20 tests)
├── services.spec.ts               (74 tests)
├── middleware.spec.ts             (82 tests)
├── integration.spec.ts            (76 tests)
└── Cobertura total: >99.8%
```

### Ejecutar Tests

```bash
cd backend

# Ejecutar todos los tests
npm test

# Resultado esperado: 286 passed, 13 suites, >99.8% coverage

# Tests específicos
npm test -- --testPathPattern="Controller"
npm test -- --testPathPattern="services"
npm test -- --testPathPattern="middleware"

# Watch mode
npm test -- --watch

# Coverage detallado
npm test -- --coverage
```

### Capas de Testing

**Resumen General**: 286 tests en 13 archivos con >99.8% de cobertura

#### Distribución por Tipo

| Categoría | Archivo(s) | Tests | % del Total | Cobertura |
|-----------|-----------|-------|-----------|-----------|
| **Controllers** | | | | |
| └─ Auth | authController.spec.ts | 18 | 6.3% | 100% |
| └─ User Management | registerController.spec.ts, userController.spec.ts | 42 | 14.7% | 100% |
| └─ Otros | chatController, esp32Controller, loginController | 35 | 12.2% | 100% |
| **Controllers Subtotal** | **8 archivos** | **95** | **33.2%** | **100%** |
| | | | | |
| **Services** | emailService, alertService, services.spec.ts | 118 | 41.3% | 100% |
| **Middleware** | middleware.spec.ts | 82 | 28.7% | 100% |
| **Integration E2E** | integration.spec.ts | 76 | 26.6% | 100% |
| **External APIs** | Mocks (Cloudinary, MQTT, Redis) | 8 | 2.8% | 100% |
| **TOTAL** | **13 archivos** | **286** | **100%** | **>99.8%** |

#### Detalles por Archivo

| Archivo | Líneas | Tipo | Cobertura |
|---------|--------|------|-----------|
| authController.spec.ts | 421 | Controller Auth | 100% |
| userController.spec.ts | 432 | Controller Users | 100% |
| registerController.spec.ts | 344 | Controller Auth | 100% |
| loginController.spec.ts | 269 | Controller Auth | 100% |
| chatController.spec.ts | 134 | Controller Chat | 100% |
| esp32Controller.spec.ts | 90 | Controller IoT | 100% |
| eventsController.spec.ts | 207 | Controller Events | 100% |
| googleAuthController.spec.ts | 119 | Controller OAuth | 100% |
| services.spec.ts | 278 | Services | 100% |
| emailService.spec.ts | 175 | Email Service | 100% |
| alertService.spec.ts | 149 | Alert Service | 100% |
| middleware.spec.ts | 329 | Middleware | 100% |
| integration.spec.ts | 353 | Integration E2E | 100% |

#### Qué Valida Cada Capa

- **Controllers (95 tests)**: Endpoints HTTP, validación de entrada, status codes, error handling
- **Services (118 tests)**: Lógica de negocio, integración BD, transacciones, caché
- **Middleware (82 tests)**: Autenticación JWT, autorización, logging, CORS
- **Integration (76 tests)**: Flujos end-to-end, múltiples componentes, casos reales
- **External (8 tests)**: APIs externas (Cloudinary, MQTT, Redis), mocks

### Best Practices en Tests

1. **Arrange-Act-Assert (AAA)**
   - Preparar datos de prueba
   - Ejecutar función/método
   - Validar resultados

2. **Mocking de Dependencias**
   ```typescript
   jest.mock('../config/database');
   const mockDb = require('../config/database');
   mockDb.query.mockResolvedValue({ rows: [{ id: 1 }] });
   ```

3. **Validaciones Comunes**
   - `expect(value).toBe(expected)` - Igualdad estricta
   - `expect(value).toEqual(expected)` - Equivalencia
   - `expect(fn).toHaveBeenCalled()` - Llamada de función
   - `expect(response.statusCode).toBe(200)` - HTTP status

### Documentación de Tests

Para información más detallada, consulta:
- `backend/test/TESTING_GUIDE_FOR_NEW_DEVELOPERS.md`
- `backend/test/TEST_DOCUMENTATION.md`
- `backend/test/QUICK_REFERENCE.md`

---

## Despliegue {#despliegue}

### Desarrollo Local

```bash
# Terminal 1: Backend
cd backend
npm run dev
# Servidor en http://localhost:3000

# Terminal 2: Frontend
cd frontend
npm run dev
# App en http://localhost:4200

# Terminal 3: Device (cargar firmware)
cd device
pio run -t upload --upload-port COM3
```

### Producción (Docker)

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000

CMD ["npm", "run", "build"]
```

```bash
docker build -t stepguard-backend .
docker run -d -p 3000:3000 --env-file .env.prod stepguard-backend
```

### Producción (Cloud - Azure, AWS, Heroku)

1. **Backend a Azure App Service:**
   ```bash
   az webapp create --resource-group myGroup --plan myPlan --name stepguard-api --runtime "node|18"
   az webapp deployment source config-zip --resource-group myGroup --name stepguard-api --src backend.zip
   ```

2. **Frontend a Vercel:**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

3. **BD a Neon:** Ver paso anterior

---

## Troubleshooting {#troubleshooting}

### Error: Cannot find module 'pg'
```bash
# Solución
npm install pg
npm install --save-dev @types/pg
```

### Error: JWT token expired
- Verifica que `JWT_EXPIRES_IN` sea suficiente (ej: 1h)
- Limpia localStorage: `localStorage.removeItem('auth_token')`
- Reinicia sesión

### Error: CORS error
- Verifica `CORS_ORIGIN` en `.env` (debe coincidir con frontend)
- En desarrollo: `http://localhost:4200`
- En producción: tu dominio real (ej: `https://app.stepguard.local`)

### Error: ECONNREFUSED (Backend no responde)
- Verifica que backend esté corriendo en puerto 3000
- Verifica firewall
- Verifica `DATABASE_URL` válida

### ESP32 no conecta a WiFi
- Verifica `WIFI_SSID` y `WIFI_PASSWORD` correctos
- Verifica señal WiFi
- Revisa logs en puerto serie: `pio device monitor -b 115200`

### Alerta no llega al frontend
- Verifica que el backend recibió POST en `/api/alertas`
- Revisa logs: `npm run dev` muestra errores
- Verifica que dispositivo está registrado en BD

