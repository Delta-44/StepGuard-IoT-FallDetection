# Diagrama de Arquitectura del Sistema StepGuard IoT

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET / NUBE                              │
│                   (PostgreSQL en Neon, Emails)                       │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬───────────────┬──────────────┐
        │                     │               │              │
        ▼                     ▼               ▼              ▼
┌──────────────┐      ┌──────────────┐  ┌──────────────┐ ┌────────────┐
│   Frontend   │      │   Backend    │  │  PostgreSQL  │ │  Nodemailer│
│  (Angular 18)│      │  (Express TS)│  │   (Neon DB)  │ │   (Email)  │
│              │      │              │  │              │ │            │
│ ├─ SPA       │      │ ├─ API REST  │  │ ├─ usuarios  │ │ ├─ SMTP    │
│ ├─ Signals   │      │ ├─ Auth JWT  │  │ ├─ cuidadores│ │ └─ TLS     │
│ ├─ Tailwind  │      │ ├─ Google    │  │ ├─ dispositivos
│ ├─ RxJS      │      │ │  OAuth     │  │ ├─ alertas   │
│ └─ Guards    │      │ ├─ Email Svc │  │ └─ relaciones│
└──────────────┘      │ ├─ CORS      │  └──────────────┘
   :3000              │ └─ Morgan    │
   localhost:4200     └──────────────┘
                         :3000
                      localhost
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐        ┌─────────┐      ┌──────────────┐
   │ ESP32-1 │        │ ESP32-2 │      │ ESP32-N      │
   │         │        │         │      │              │
   │ ├─ WiFi │        │ ├─ WiFi │      │ ├─ WiFi      │
   │ ├─ MPU  │        │ ├─ MPU  │      │ ├─ MPU       │
   │ ├─ Alert│        │ ├─ Alert│      │ ├─ Alert     │
   │ └─ OTA  │        │ └─ OTA  │      │ └─ OTA       │
   └─────────┘        └─────────┘      └──────────────┘
   (Paciente 1)       (Paciente 2)     (Paciente N)
   │                  │                │
   │ HTTP POST        │ HTTP POST       │ HTTP POST
   │ /api/alertas     │ /api/alertas    │ /api/alertas
   │                  │                │
   └──────────────────┴────────────────┘
                      │
                      ▼
              Backend recibe evento
              → Valida datos
              → Guarda en BD
              → Notifica por email
              → WebSocket a Frontend
                      │
                      ▼
                 Frontend actualiza
                 → Alerta en tiempo real
                 → Cambio de color
                 → Sonido/Toast
```

## Componentes Detallados

### 1. Frontend (Angular 18+)
- **Auth Guard**: Protege rutas según roles
- **Interceptor HTTP**: Añade token JWT automáticamente
- **Services**: 
  - `AuthService`: Gestión de sesión
  - `UserService`: CRUD de usuarios
  - `AlertService`: Notificaciones en tiempo real
- **Components**: Dashboard, Usuarios, Dispositivos, Alertas
- **State**: Signals (no necesita NgRx)

### 2. Backend (Express + TypeScript)
- **Controllers**: Manejan lógica de negocio
  - `authController`: Login, reset password
  - `registerController`: Nuevos usuarios
  - `userController`: Listado y detalles
  - `alertController`: Gestión de alertas (pendiente)
- **Models**: Interfaces con BD
  - `UsuarioModel`: Pacientes
  - `CuidadorModel`: Cuidadores/admins
  - `DispositivoModel`: Devices ESP32
  - `AlertaModel`: Eventos de caídas
- **Middleware**: Auth, CORS, Morgan
- **Services**: Nodemailer para emails

### 3. Base de Datos (PostgreSQL - Neon)
- Tablas: usuarios, cuidadores, dispositivos, alertas, usuario_cuidador
- Relaciones: 1-N y N-N
- Transacciones: Garantizan consistencia

### 4. Dispositivos IoT (ESP32)
- **MPU6050**: Acelerómetro 6-DOF
- **WiFi**: Conectividad a red
- **Algoritmos**: Detección de caídas en tiempo real
- **Actuadores**: Vibrador, display, LED
- **OTA**: Actualización remota

## Flujo de Datos

```
ESP32 (Sensor) 
  → Lee aceleración (MPU6050)
  → Procesa algoritmo de caída
  → Detecta evento
  → Envía HTTP POST /api/alertas {dispositivo_id, tipo, timestamp}
  
Backend
  → Valida token/dispositivo
  → Guarda alerta en BD
  → Envía email al cuidador
  → WebSocket a Frontend (o polling)
  
Frontend
  → Recibe alerta en tiempo real
  → Actualiza dashboard
  → Muestra notificación prominente
  → Usuario ve cambio en segundos
```

## Seguridad

```
┌─ JWT Token (1h)
│  ├─ Header: {alg: HS256, typ: JWT}
│  ├─ Payload: {id, email, role}
│  └─ Signature: HMAC-SHA256(header.payload, JWT_SECRET)
│
├─ Contraseñas
│  ├─ Hasheo: bcryptjs (salt: 10)
│  ├─ Reset: JWT con propósito específico (1h)
│  └─ Actualización: timestamp de cambio
│
└─ CORS
   └─ Permitido solo: http://localhost:4200 (ajustar en prod)
```

## Escalabilidad Futura

- Redis: Caché de sesiones y alertas
- WebSocket: Push real-time en lugar de polling
- Message Queue: RabbitMQ/Kafka para alertas
- Microservicios: Separar auth, alertas, usuarios
- Contenedores: Docker + Kubernetes

