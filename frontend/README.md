# 🎯 StepGuard IoT - Frontend

Este es el módulo de interfaz web para el sistema de detección de caídas **StepGuard IoT**.
Desarrollado con **Angular 18+** utilizando la nueva arquitectura basada en **Signals**, **Control Flow** (`@if`, `@for`) y **Standalone Components**.

## 🚀 Características Implementadas

### 1. Autenticación y Seguridad
* **Login con Backend Real:** Integración completa con API REST en Neon PostgreSQL
* **Google OAuth:** Autenticación con Google Sign-In integrada
* **Recuperación de Contraseña:** Sistema de "olvidé mi contraseña" con JWT y email
* **Guards:** Protección de rutas (`authGuard`) para evitar accesos no autorizados
* **HTTP Interceptor:** Inyección automática de token JWT en todas las peticiones
* **Roles Diferenciados:** 
    - Admin: Acceso completo al sistema
    - Cuidador: Gestión de pacientes y alertas
    - Usuario: Vista básica de información
* **Sesión Persistente:** Token almacenado en `localStorage` como `auth_token`

### 2. Landing Page Moderna
* **Diseño Profesional:** Página de inicio con Tailwind CSS
* **Animaciones:** Efectos visuales con transiciones suaves
* **Responsive:** Adaptado a móviles, tablets y desktop
* **CTAs:** Botones de "Iniciar Sesión" y "Registrarse" con modales integrados

### 3. Dashboard Interactivo
* **Visualización en Tiempo Real:** Alertas y eventos de caídas actualizadas
* **Sistema de Prioridad:** Cambio de color según severidad (Crítica/Alta/Media/Baja)
* **Banner de Emergencia:** Alerta roja prominente para eventos críticos
* **Mini Alertas Toast:** Notificaciones no intrusivas en esquina superior
* **Estado Global:** Indicador visual del estado del sistema
* **Gráficos y Estadísticas:** Visualización de métricas con Lucide Icons

### 4. Gestión de Dispositivos ESP32
* **Listado de Sensores:** Estado en tiempo real (`ONLINE`/`OFFLINE`)
* **Nivel de Batería:** Indicador visual con iconos y colores
* **Ubicación:** Información de localización del dispositivo
* **Control Remoto:** Reinicio de dispositivos (exclusivo Admin)
* **Sensibilidad:** Ajuste de parámetros de detección
* **Integración IoT:** Conexión real con dispositivos ESP32 vía backend

### 5. Gestión de Usuarios (CRUD Completo)
* **Listado desde BD:** Usuarios reales de Neon PostgreSQL
* **Caché Inteligente:** BehaviorSubject para carga optimizada (single-load)
* **Historial de Alertas:** Ver alertas asociadas a cada usuario
* **Filtrado por Rol:** Visualización según permisos
* **CRUD Preparado:** Estructura lista para crear, editar y eliminar (endpoints pendientes)

### 6. Sistema de Alertas Avanzado
* **Múltiples Tipos:** Crítica, Alta, Media, Baja
* **Persistencia:** Almacenamiento en Redis y PostgreSQL
* **Filtrado:** Por dispositivo, usuario, fecha y severidad
* **Acciones:** Atender, rechazar, ver detalles
* **Notificaciones Email:** Envío automático vía nodemailer

## 🛠️ Stack Tecnológico

### Core
* **Angular 18+** - Framework principal con Standalone Components
* **TypeScript 5.9+** - Tipado estático y features modernas
* **RxJS** - Programación reactiva con Observables y BehaviorSubject

### UI/UX
* **Tailwind CSS** - Framework de utilidades CSS
* **Lucide Angular** - Iconos SVG modernos y personalizables
* **CSS Custom Properties** - Variables para theming

### Arquitectura
* **Signals** - Gestión de estado reactivo nativa de Angular
* **Control Flow** - Sintaxis `@if`, `@for`, `@switch` para mejor performance
* **HTTP Interceptors** - Manejo centralizado de autenticación
* **Route Guards** - Protección de rutas con `CanActivateFn`
* **Services con Injection** - `inject()` para inyección de dependencias

### Integraciones
* **Google Sign-In** - OAuth 2.0 para autenticación con Google
* **Email Service** - Nodemailer con Gmail SMTP
* **PostgreSQL (Neon)** - Base de datos remota en la nube
* **Redis Cloud** - Caché y sesiones

## 📦 Instalación y Ejecución

### Prerrequisitos
* Node.js 18+ y npm
* Angular CLI: `npm install -g @angular/cli`

### Instalación
```bash
# Instalar dependencias
npm install
```

### Desarrollo
```bash
# Iniciar servidor de desarrollo
npm start
# o
ng serve

# La aplicación estará en http://localhost:4200
```

### Build de Producción
```bash
# Compilar para producción
ng build --configuration production

# Los archivos estarán en dist/frontend/browser/
```

## 🔗 Integración con Backend

El frontend está **completamente integrado** con el backend Express:

### API Endpoints Utilizados
* `POST /api/auth/login` - Login con email/password
* `POST /api/auth/register/usuario` - Registro de pacientes
* `POST /api/auth/register/cuidador` - Registro de cuidadores
* `POST /api/auth/google` - Autenticación con Google
* `POST /api/auth/forgot-password` - Solicitar reset de contraseña
* `POST /api/auth/reset-password` - Confirmar nueva contraseña
* `GET /api/users` - Obtener lista de usuarios
* `GET /api/users/:id` - Obtener usuario específico
* `GET /api/alerts` - Obtener alertas
* `GET /api/devices` - Obtener dispositivos ESP32

### Configuración
La URL del backend se configura en:
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

### Autenticación
* Token JWT almacenado en `localStorage` como `auth_token`
* HTTP Interceptor añade automáticamente header: `Authorization: Bearer <token>`
* Expiración de token: 24 horas
* Refresh automático al hacer login

## 📁 Estructura del Proyecto

```
frontend/src/
├── app/
│   ├── components/           # Componentes de UI
│   │   ├── alerts/          # Gestión de alertas
│   │   ├── dashboard/       # Panel principal
│   │   ├── devices/         # Lista de dispositivos
│   │   ├── users/           # Gestión de usuarios
│   │   ├── login-modal/     # Modal de login
│   │   └── register-modal/  # Modal de registro
│   ├── pages/
│   │   ├── landing/         # Página de inicio pública
│   │   └── reset-password/  # Página de reset de contraseña
│   ├── services/            # Servicios de negocio
│   │   ├── auth.service.ts      # Autenticación
│   │   ├── user.service.ts      # Gestión de usuarios
│   │   ├── alert.service.ts     # Alertas
│   │   └── api.service.ts       # HTTP Cliente base
│   ├── interceptors/
│   │   └── auth.interceptor.ts  # Interceptor JWT
│   ├── guards/
│   │   └── auth.guard.ts        # Protección de rutas
│   ├── models/              # Interfaces TypeScript
│   ├── app.config.ts        # Configuración de la app
│   ├── app.routes.ts        # Definición de rutas
│   └── app.ts               # Componente raíz
├── environments/            # Configuración por entorno
└── styles.css              # Estilos globales
```

## 🎨 Temas y Estilos

### Paleta de Colores
```css
--primary: #3b82f6        /* Azul principal */
--critical: #ef4444       /* Rojo para alertas críticas */
--warning: #f59e0b        /* Amarillo para advertencias */
--operational: #10b981    /* Verde para estado OK */
--base-text: #1e293b      /* Texto principal */
--base-bg: #f8fafc        /* Fondo base */
```

### Iconos Disponibles
UserCircle, BarChart3, Shield, Users, AlertTriangle, Smartphone, Activity, Bell, Settings, LogOut, MapPin, Clock, Heart, Mail, Phone, Battery, Wifi, y más.

## 🔐 Credenciales de Prueba

### Base de Datos Neon (Producción)
Los usuarios reales están en la base de datos remota:
* **Admin:** `admin@stepguard.com` / `admin123`
* **Cuidador:** `ana.martinez@stepguard.com` / `cuidador123`
* **Usuario:** `juan@stepguard.com` / `user123`

## 📊 Estado del Proyecto

✅ **Funcionalidades Completas:**
- Autenticación con backend (JWT + Google OAuth)
- Landing page profesional
- Dashboard con alertas en tiempo real
- Gestión de usuarios con caché
- Sistema de alertas críticas y mini-alertas
- Recuperación de contraseña por email
- Integración completa con Neon PostgreSQL
- HTTP Interceptor para autenticación
- Responsive design con Tailwind

🚧 **Pendientes:**
- Endpoints CRUD completos para usuarios (POST, PUT, DELETE)
- Incluir cuidadores en lista de usuarios
- Gráficos estadísticos avanzados
- PWA (Progressive Web App)
- Notificaciones push en navegador

---
**Proyecto:** Sistema Inteligente de Detección de Caídas
**Estado:** Frontend en Producción ✅
**Stack:** Angular 18 + Tailwind + Neon PostgreSQL + Redis