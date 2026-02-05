# Manual de Usuario - StepGuard IoT

## Tabla de Contenidos
1. [Descripción del Sistema](#descripcion)
2. [Roles y Permisos](#roles)
3. [Inicio de Sesión](#inicio-de-sesion)
4. [Panel de Control](#panel-de-control)
5. [Gestión de Dispositivos](#dispositivos)
6. [Gestión de Usuarios](#usuarios)
7. [Respuesta a Alertas](#alertas)
8. [Preguntas Frecuentes](#faq)

---

## Descripción del Sistema {#descripcion}

**StepGuard IoT** es una plataforma de detección de caídas en tiempo real para personas adultas mayores y con movilidad reducida.

### Características Principales

- 🎯 **Detección automática de caídas** mediante acelerómetro 6-DOF
- 📱 **Alertas instantáneas** en dispositivo y panel web
- 👥 **Gestión de cuidadores** autorizados
- 📊 **Historial de alertas** y estadísticas
- 🔐 **Autenticación segura** con JWT
- 🌐 **Interfaz web responsiva** para PC y tablet

---

## Roles y Permisos {#roles}

### Usuario Final (Persona Mayor)
- ✅ Ver su perfil
- ✅ Ver dispositivos asignados
- ✅ Ver alertas recientes
- ✅ Contactar cuidadores

**Permisos limitados**: No puede crear usuarios ni dispositivos

### Cuidador (Caregiver)
- ✅ Ver perfil
- ✅ Gestionar múltiples usuarios asignados
- ✅ Ver alertas de sus usuarios en tiempo real
- ✅ Responder alertas (confirmación de asistencia)
- ✅ Ver dispositivos de sus usuarios
- ✅ Reportar dispositivos defectuosos

**Permisos limitados**: No puede crear nuevos usuarios

### Administrador
- ✅ Acceso total al sistema
- ✅ Crear/editar/eliminar usuarios y cuidadores
- ✅ Gestionar dispositivos (registrar, actualizar config)
- ✅ Ver reportes y estadísticas
- ✅ Crear respaldos de base de datos

---

## Inicio de Sesión {#inicio-de-sesion}

### Opción 1: Email y Contraseña

1. Ir a https://stepguard.app
2. Hacer clic en **"Iniciar Sesión"**
3. Ingresar email y contraseña
4. Hacer clic en **"Entrar"**

```
Pantalla de login:
┌─────────────────────────────────────┐
│         🔐 StepGuard IoT            │
│                                     │
│  Email:    [________________]       │
│  Contraseña: [_____________]        │
│             ☑ Recordarme            │
│                                     │
│     [    Entrar    ]  [Google]      │
│                                     │
│  ¿No tienes cuenta? Regístrate      │
│  ¿Olvidaste contraseña?             │
└─────────────────────────────────────┘
```

### Opción 2: Google Sign-In

1. Hacer clic en botón **"Continuar con Google"**
2. Seleccionar tu cuenta Google
3. Autorizar acceso a StepGuard
4. Se redirige automáticamente al dashboard

### Recuperar Contraseña

1. En pantalla de login, hacer clic en **"¿Olvidaste contraseña?"**
2. Ingresar correo electrónico
3. Revisar email para enlace de reset
4. Hacer clic en enlace (válido 24 horas)
5. Crear nueva contraseña (min 8 caracteres)
6. Iniciar sesión con nueva contraseña

---

## Panel de Control {#panel-de-control}

### Vista General (Todos los Roles)

```
┌──────────────────────────────────────────────────────────┐
│  Logo    Menu Hamburguesa         👤 Usuario ⚙️ Salir    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📊 PANEL DE CONTROL                                    │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ 2 Alertas  │  │ 3 Usuarios │  │ 2 Dispositivos     │
│  │  Hoy       │  │ Monitoreados│  │ Online             │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                          │
│  📋 ÚLTIMAS ALERTAS                                     │
│  ─────────────────────────────────────────────────────  │
│  | Tipo | Usuario | Hora | Estado | Acción |           │
│  |------|---------|------|--------|--------|           │
│  | Caída | Juan C. | 10:15 | Respondida | ✓ |        │
│  | Caída | María G.| 09:30 | Pendiente  | 📞 |        │
│                                                          │
│  📱 DISPOSITIVOS                                        │
│  ─────────────────────────────────────────────────────  │
│  | Dispositivo | Usuario | Estado | Batería |          │
│  |-------------|---------|--------|---------|          │
│  | ESP32-001   | Juan C. | ONLINE | 85%     |          │
│  | ESP32-002   | María G.| OFFLINE| 12%     |          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Navegación (Menú Lateral)

```
├── 🏠 Dashboard
├── 👥 Usuarios
├── 📱 Dispositivos
├── 🚨 Alertas
├── 📊 Reportes
├── ⚙️ Configuración
│   ├── Mi Perfil
│   ├── Preferencias
│   ├── Privacidad
│   └── Notificaciones
├── 🆘 Ayuda
└── 🚪 Salir
```

---

## Gestión de Dispositivos {#dispositivos}

### Ver Dispositivos

1. Ir a **📱 Dispositivos** en menú
2. Se muestra lista con:
   - **Nombre**: ej "Abuelo en Casa"
   - **Usuario**: A quién está asignado
   - **Estado**: ONLINE (conectado) / OFFLINE (desconectado)
   - **Batería**: % de carga
   - **Última conexión**: Timestamp

### Registrar Nuevo Dispositivo

**Solo para Administrador:**

1. Click en **"+ Registrar Dispositivo"**
2. Escanear código QR o ingresar **Device ID** (MAC address ESP32)
3. Completar formulario:
   ```
   Nombre: [Habitación Abuela    ]
   Ubicación: [Calle Principal 123]
   Modelo: [ESP32-DevKitC v4      ]
   Sensibilidad: [Estándar ▼]
   Asignar a Usuario: [Juan García ▼]
   ```
4. Click **"Registrar"**
5. Aparecerá PIN de configuración (ej: 5847)
6. Ingresar PIN en dispositivo físico via botones
7. Cuando se conecte, aparecerá "✓ Registrado" en verde

### Actualizar Configuración

1. Click en dispositivo
2. Click **"⚙️ Configuración"**
3. Ajustar parámetros:
   - **Sensibilidad de detección**: Baja (menos falsos), Normal, Alta (más sensible)
   - **LED notificaciones**: Activado/Desactivado
   - **Vibración en alerta**: Activado/Desactivado
4. Click **"Guardar"**

### Desactivar Dispositivo

1. Click en dispositivo
2. Click **"Más opciones"** (⋮)
3. Click **"Desactivar"**
4. Confirmar en ventana emergente

**Nota**: Dispositivo desactivado no enviará alertas

---

## Gestión de Usuarios {#usuarios}

### Ver Usuarios (Cuidador/Admin)

1. Ir a **👥 Usuarios**
2. Se muestra tabla:
   - **Nombre**
   - **Email**
   - **Edad/DNI**
   - **Dispositivos**: Cuántos tiene asignados
   - **Última alerta**: Timestamp o "Sin alertas"

### Crear Nuevo Usuario (Solo Admin)

1. Click **"+ Nuevo Usuario"**
2. Completar formulario:
   ```
   Nombre: [Juan Carlos García    ]
   Email: [juan.garcia@email.com   ]
   Edad: [75          ]
   DNI: [12345678-X  ]
   Dirección: [Calle Principal 123]
   Teléfono: [+34 912345678      ]
   Cuidador Asignado: [María López ▼]
   ```
3. Generar contraseña temporal:
   - Se genera automáticamente
   - Se envía por email
   - Usuario debe cambiarla en primer login
4. Click **"Crear Usuario"**

### Editar Perfil

1. Click en **⚙️ (arriba derecha)**
2. Click en **"Mi Perfil"**
3. Editar campos:
   ```
   Nombre: [Mi nombre              ]
   Email: [mi.email@ejemplo.com   ]
   Teléfono: [+34 912345678       ]
   Foto de Perfil: [📷 Cambiar]
   ```
4. Click **"Guardar Cambios"**

### Cambiar Contraseña

1. **⚙️ → "Configuración"**
2. Click **"Cambiar Contraseña"**
3. Ingresar:
   ```
   Contraseña actual: [____________]
   Nueva contraseña: [_____________] (mín 8 caracteres)
   Confirmar: [___________________]
   ```
4. Click **"Actualizar"**

### Asignar Cuidador

**Solo Admin:**

1. Ir a **👥 Usuarios**
2. Click en usuario
3. Click **"Asignar Cuidador"**
4. Seleccionar cuidador(es) de lista
5. Click **"Guardar"**

Un usuario puede tener múltiples cuidadores.

---

## Respuesta a Alertas {#alertas}

### Recibir Alerta

**El dispositivo vibra 3 veces + sonido de alerta**

```
Pantalla ESP32:
┌─────────────┐
│    ⚠️ ALERTA│
│    CAÍDA    │
│  DETECTADA  │
│             │
│  OK=Llamar  │
│  X=Cancelar │
│             │
│  Contacting...
│  Ambulancia
└─────────────┘
```

### En el Dispositivo

1. **Botón OK**: Llamar a cuidador (automático)
   - Llama a número de emergencia
   - Envía SMS a cuidadores
   - Actualiza estado en web

2. **Botón X**: Cancelar falsa alarma
   - Si NO fue caída real
   - Previene ambulancia innecesaria

3. **Sin presionar**: Después de 30 segundos
   - Se llama automáticamente a emergencia
   - Asume pérdida de consciencia

### En la Web

```
Notificación emergente (top-right):
┌─────────────────────────────────────────┐
│ 🚨 ALERTA DE CAÍDA                      │
│ Usuario: Juan García                    │
│ Dispositivo: Habitación Abuela          │
│ Hora: 14:35:22                          │
│ Ubicación: Casa Principal               │
│                                         │
│ [ 📞 Llamar ]  [ ✓ Confirmada ]  [ X ]  │
└─────────────────────────────────────────┘
```

1. **📞 Llamar**: Inicia llamada WhatsApp/Teléfono
2. **✓ Confirmada**: Marcar como atendida
3. **X**: Cerrar notificación

### Ver Historial de Alertas

1. Ir a **🚨 Alertas**
2. Filtrar por:
   - Fecha (hoy, esta semana, este mes)
   - Usuario
   - Estado (Pendiente, Respondida, Cancelada)
   - Tipo (Caída, Inactividad, Batería baja)

```
Tabla de alertas:
| Fecha | Hora | Usuario | Tipo | Estado | Tiempo Respuesta |
|-------|------|---------|------|--------|-----------------|
|15/11  |14:35 | Juan C. | Caída|Respondida| 2 min 15 seg |
|14/11  |09:20 | María G.|Caída|Pendiente| - |
|13/11  |16:45 | Juan C. | Caída|Cancelada| - |
```

---

## Preguntas Frecuentes {#faq}

### ¿Cuán rápido detecta una caída?
**Respuesta**: El dispositivo detecta una caída en menos de 500ms y envía alerta a servidores en máximo 2 segundos. La notificación llega a cuidadores en 2-5 segundos dependiendo de conexión internet.

### ¿Qué pasa si el WiFi se desconecta?
**Respuesta**: El dispositivo registra la alerta en memoria local y la envía automáticamente cuando se reconecta. Máximo 1 minuto sin conexión.

### ¿Cuánto dura la batería?
**Respuesta**: Aproximadamente 8-10 horas con uso normal (1 alerta cada 2 horas). Cargue cada noche. El LED se enciende cuando batería < 20%.

### ¿Falsos positivos?
**Respuesta**: 
- Costo normal: ~5% (levantarse rápido, tirar objeto, etc)
- Puedes ajustar **sensibilidad** en ⚙️ Dispositivos
- Usuario puede cancelar presionando botón X

### ¿Cuántos cuidadores puede tener un usuario?
**Respuesta**: Ilimitados. Todos reciben alertas simultáneamente. Primero en responder marca como "atendida".

### ¿Es seguro mi información?
**Respuesta**: 
- ✅ Contraseñas encriptadas con bcrypt
- ✅ Datos en tránsito cifrados con HTTPS
- ✅ JWT con expiración 1 hora
- ✅ No compartimos datos con terceros

### ¿Cómo agrego un cuidador?
**Respuesta**:
1. Solo Administrador puede crear cuidadores
2. Ir a **👥 Usuarios → + Nuevo Cuidador**
3. Ingresar email (cuidador recibe invitación)
4. Cuidador completa perfil
5. Admin asigna cuidador a usuario(s)

### ¿Qué pasa si olvido contraseña?
**Respuesta**:
1. Click **"¿Olvidaste contraseña?"** en login
2. Ingresa email
3. Recibirás link en 2 minutos
4. Link válido 24 horas
5. Crea nueva contraseña

### ¿Puedo usar múltiples dispositivos?
**Respuesta**: Sí, pero recomendamos 1 por persona (dispositivo + usuario = 1:1). Múltiples dispositivos por usuario pueden crear alertas duplicadas.

### ¿Cómo contacto soporte?
**Respuesta**:
- 📧 Email: soporte@stepguard.com
- 📞 Teléfono: +34 900 123 456 (L-V 9-18h)
- 💬 Chat: Via web (ícono bottom-right)
- 📋 Formulario: https://stepguard.com/contacto

