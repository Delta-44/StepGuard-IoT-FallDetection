# Plan de Pruebas de Integración - StepGuard IoT

## Tabla de Contenidos
1. [Descripción General](#descripcion)
2. [Entorno de Pruebas](#entorno)
3. [Casos de Prueba](#casos)
4. [Procedimiento de Ejecución](#procedimiento)
5. [Criterios de Aceptación](#criterios)
6. [Matriz de Cobertura](#matriz)

---

## Descripción General {#descripcion}

Las pruebas de integración validan que todos los componentes (ESP32, Backend, Frontend, Base de Datos) funcionen juntos correctamente en escenarios reales.

### Objetivos

✅ Verificar detección de caída en tiempo real (< 2 segundos)
✅ Validar flujo completo: Sensor → Backend → Web
✅ Confirmar alertas llegan correctamente a cuidadores
✅ Pruebar respuesta y confirmación de alertas
✅ Validar persistencia en base de datos
✅ Verificar comportamiento ante conexión inestable

### Alcance

- ✅ Sensor MPU6050 → ESP32
- ✅ ESP32 → Servidor Backend
- ✅ Backend → Base de datos
- ✅ Backend → Frontend (WebSocket/REST)
- ✅ Interfaz web → Cuidador
- ❌ Llamadas telefónicas (mock con SMS)
- ❌ Integración Google Auth (mock)

---

## Entorno de Pruebas {#entorno}

### Hardware Requerido

| Componente | Cantidad | Especificación |
|-----------|----------|-----------------|
| ESP32 | 2 | DevKitC v4 con MPU6050 |
| Acelerómetro | 2 | GY-521 (MPU6050) |
| Cables Jumpers | 20 | Macho-Macho, 10cm |
| Cables USB | 3 | Micro-USB para ESP32 y carga |
| Router WiFi | 1 | 5GHz + 2.4GHz |
| PC/Laptop | 1 | Windows/Linux/Mac |
| Teléfono móvil | 2 | Para recibir SMS (opcional) |

### Software Requerido

```bash
# Backend
Node.js v18+
npm 8+
PostgreSQL 12+
Postman (para REST API testing)

# Frontend
Node.js v18+
npm 8+

# Device
Python 3.7+
PlatformIO CLI
USB drivers (CP210x para ESP32)

# Testing
pytest (para scripts Python)
curl o Postman
Browser DevTools
```

### Configuración de Red

```
┌─────────────────────────────────────┐
│       Router WiFi Privada           │
│      192.168.1.1 (SSID: TestNet)   │
├──────────────────────────────────────┤
│                                      │
├─ PC Backend:        192.168.1.100   │
├─ ESP32-001:         192.168.1.101   │
├─ ESP32-002:         192.168.1.102   │
├─ PC Frontend:       192.168.1.103   │
│                                      │
└─────────────────────────────────────┘
```

### Base de Datos

```sql
-- Crear base de datos de pruebas
CREATE DATABASE caidas_test;

-- Usuarios de prueba
INSERT INTO usuarios (nombre, email, password_hash, dispositivo_id)
VALUES 
  ('Test User 1', 'test1@local.test', 'hashed_pass_123', 1),
  ('Test User 2', 'test2@local.test', 'hashed_pass_456', 2);

-- Cuidadores de prueba
INSERT INTO cuidadores (nombre, email, password_hash, is_admin)
VALUES 
  ('Test Caregiver', 'caregiver@local.test', 'hashed_pass_789', TRUE);

-- Dispositivos de prueba
INSERT INTO dispositivos (device_id, mac_address, nombre, estado)
VALUES 
  ('ESP32-TEST-001', 'AA:BB:CC:DD:EE:01', 'Device Test 1', 'ONLINE'),
  ('ESP32-TEST-002', 'AA:BB:CC:DD:EE:02', 'Device Test 2', 'ONLINE');
```

---

## Casos de Prueba {#casos}

### Caso 1: Detección de Caída Simulada (Más Crítico)

**Objetivo**: Validar que una caída real es detectada y alerta llega en < 2 segundos

**Precondiciones**:
- ✅ ESP32 conectado a WiFi
- ✅ Backend corriendo en `http://192.168.1.100:3000`
- ✅ Frontend accesible en `http://192.168.1.103:4200`
- ✅ Base de datos con usuario y dispositivo sincronizados
- ✅ Sesión de cuidador abierta en browser

**Pasos**:

1. **Verificación inicial**
   ```bash
   # Terminal 1: Monitoreo de ESP32
   pio device monitor -b 115200 --port COM3
   
   # Esperado: "Waiting for fall detection..."
   ```

2. **Simular caída física**
   ```
   Método 1: Golpe seco al acelerómetro
   - Sostener ESP32 en posición normal (90°)
   - Golpe rápido hacia abajo (simula caída)
   - Verificar que aceleración > 3.5g detecte
   
   Método 2: Levantamiento rápido y soltada en mesa
   - Levantar ESP32 30cm
   - Soltar para que caiga sobre escritorio
   - Debe producir aceleración > 3.5g
   ```

3. **Monitoreo en tiempo real**
   ```bash
   # Terminal 2: Logs de Backend
   npm run dev
   
   # Esperado en logs:
   # [14:35:22] POST /api/dispositivos/ESP32-TEST-001/alertas
   # [14:35:22] Alerta guardada en BD con id=2847
   # [14:35:22] WebSocket broadcast to 3 clients
   ```

4. **Verificación en Frontend**
   ```
   Abrir DevTools (F12)
   - Console: Ver mensaje de alerta recibida
   - Network: POST a /api/alertas debe ser 200 OK
   - UI: Notificación roja en top-right dentro de 500ms
   ```

5. **Validación de datos**
   ```sql
   -- En psql, verificar alerta en BD
   SELECT * FROM alertas 
   WHERE dispositivo_id = 1 
   ORDER BY timestamp DESC LIMIT 1;
   
   -- Esperado: timestamp = NOW(), leida = FALSE, respondida = FALSE
   ```

**Criterios de Éxito**:
- ✅ Alerta llega a backend en < 500ms de la caída
- ✅ Frontend recibe notificación en < 1 segundo
- ✅ Base de datos registra alerta inmediatamente
- ✅ Notificación visible al cuidador
- ⏱️ **Tiempo total: < 2 segundos**

**Salidas esperadas**:
```
ESP32 Serial:
[14:35:22.123] Aceleración pico: 4.2g
[14:35:22.341] Threshold alcanzado: POST /api/alertas
[14:35:22.652] Response: 200 OK

Backend Logs:
[14:35:22] Fall alert received from ESP32-TEST-001
[14:35:22] Alert saved: id=2847, timestamp=2024-11-15T14:35:22Z
[14:35:22] Broadcasting to 3 connected clients

Frontend:
🚨 Toast notification visible
Browser console: "Fall alert received"
Network tab: Request completed in 234ms
```

---

### Caso 2: Confirmación de Alerta por Cuidador

**Objetivo**: Validar que cuidador puede confirmar alerta y marcarla como respondida

**Precondiciones**:
- ✅ Caso 1 completado (alerta generada)
- ✅ Cuidador autenticado en panel web
- ✅ Alerta visible en notificación

**Pasos**:

1. **En el Panel Web (Cuidador)**
   ```
   1. Ver notificación: "🚨 ALERTA DE CAÍDA - Juan García"
   2. Click en botón "✓ Confirmada"
   3. Se abre diálogo de confirmación
   4. Ingresar comentario: "Asistencia proporcionada"
   5. Click "Confirmar y registrar"
   ```

2. **Monitoreo de Backend**
   ```bash
   # Esperado en logs:
   # PUT /api/alertas/2847/confirmar
   # { respondida: true, comentario: "Asistencia proporcionada" }
   # Status: 200 OK
   ```

3. **Validación en BD**
   ```sql
   SELECT respondida, leida, timestamp_respuesta 
   FROM alertas WHERE id = 2847;
   
   -- Esperado: respondida=TRUE, leida=TRUE, timestamp_respuesta=NOW()
   ```

4. **Verificación en Frontend**
   ```
   - Notificación desaparece en 3 segundos
   - Lista de alertas se actualiza (muestra "Respondida")
   - Badge de alertas pendientes disminuye en 1
   ```

**Criterios de Éxito**:
- ✅ Cambio se refleja en BD en < 1 segundo
- ✅ Frontend actualiza UI sin recargar
- ✅ Marca de tiempo se registra correctamente
- ✅ Comentario se guarda

---

### Caso 3: Cancelación de Falsa Alarma

**Objetivo**: Validar cancelación de alarma en dispositivo

**Precondiciones**:
- ✅ Alerta generada en ESP32
- ✅ Botón X en ESP32 accesible

**Pasos**:

1. **Simular caída nuevamente**
   ```
   Golpe rápido al ESP32 → Alerta generada
   ```

2. **Presionar Botón X en ESP32**
   ```
   Tiempo límite: 30 segundos
   Si se presiona antes: Alerta cancelada localmente
   ```

3. **Monitoreo de Backend**
   ```bash
   # Si fue cancelada localmente (X presionado):
   # Backend no recibe POST (ESP32 no envía)
   
   # Si pasaron 30 segundos (no se presionó nada):
   # Backend recibe: POST /api/alertas con tipo="AUTO"
   ```

4. **Validación en Frontend**
   ```
   - Si cancelada localmente: Sin notificación en web
   - Si automática (30s): Notificación de "Alerta automática"
   ```

**Criterios de Éxito**:
- ✅ Alerta cancelada en < 100ms después de presionar X
- ✅ No se envía POST a backend si se cancela
- ✅ Contador de 30 segundos funciona correctamente
- ✅ Auto-llamada ocurre si no se presiona nada

---

### Caso 4: Persistencia en Desconexión WiFi

**Objetivo**: Validar que alertas se envían cuando WiFi se reconecta

**Precondiciones**:
- ✅ ESP32 conectado a WiFi
- ✅ Router accesible

**Pasos**:

1. **Desconectar WiFi del Router**
   ```bash
   # Opción A: Desactivar 2.4GHz temporalmente
   # Opción B: Presionar botón WPS 3 segundos
   # Opción C: Desenchufar router
   ```

2. **Simular caída mientras desconectado**
   ```
   Golpe al ESP32 → Alerta detectada
   ESP32 guarda en memoria: tipo=OFFLINE
   ```

3. **Verificación en ESP32 Serial**
   ```
   [14:40:15] Fall detected, trying to POST...
   [14:40:16] WiFi not connected, storing locally
   [14:40:16] Stored alerts in RAM: 1
   ```

4. **Reconectar WiFi**
   ```bash
   # Reactivar 2.4GHz o reconectar router
   # Esperar ~5 segundos
   ```

5. **Verificación en Backend**
   ```bash
   # Logs deben mostrar:
   [14:40:25] POST /api/alertas (offline-queued)
   [14:40:25] Processing delayed alert: stored 10s ago
   ```

6. **Validación en Frontend**
   ```
   - Alerta aparece en web después de reconexión
   - Timestamp muestra hora original de caída (no hora de envío)
   - Flags: leida=FALSE (como si fuera nueva)
   ```

**Criterios de Éxito**:
- ✅ Alerta guardada en RAM si WiFi no disponible
- ✅ Máximo 1 minuto sin conexión antes de perder datos
- ✅ Envío automático al reconectar
- ✅ Timestamp preservado correctamente

---

### Caso 5: Múltiples Alertas Simultáneas

**Objetivo**: Validar comportamiento con 2 dispositivos generando alertas

**Precondiciones**:
- ✅ 2 ESP32 configurados (ESP32-001, ESP32-002)
- ✅ Ambos conectados a WiFi
- ✅ Ambos con usuarios asignados

**Pasos**:

1. **Abrir dos terminals con monitoreo**
   ```bash
   # Terminal A: ESP32-001
   pio device monitor -b 115200 --port COM3
   
   # Terminal B: ESP32-002
   pio device monitor -b 115200 --port COM4
   ```

2. **Simular caídas casi simultáneamente**
   ```
   Tiempo 14:45:10 - Golpe ESP32-001
   Tiempo 14:45:12 - Golpe ESP32-002 (2 segundos después)
   ```

3. **Monitoreo en Backend**
   ```bash
   npm run dev
   
   # Esperado:
   [14:45:10.123] POST /api/alertas from ESP32-001
   [14:45:10.234] Alert 1 saved (id=2848)
   [14:45:12.456] POST /api/alertas from ESP32-002
   [14:45:12.567] Alert 2 saved (id=2849)
   [14:45:12.568] Broadcasting 2 alerts to clients
   ```

4. **Verificación en Frontend**
   ```
   - 2 notificaciones toast (apiadas verticalmente)
   - Ambas con información correcta del usuario
   - Contador de alertas = 2
   ```

5. **Validación en BD**
   ```sql
   SELECT COUNT(*) as alertas_totales 
   FROM alertas 
   WHERE timestamp > NOW() - INTERVAL '1 minute'
   AND dispositivo_id IN (1, 2);
   
   -- Esperado: 2
   ```

**Criterios de Éxito**:
- ✅ Ambas alertas procesadas sin pérdida
- ✅ Carga de backend no excede 50% CPU
- ✅ BD procesa ambas transacciones correctamente
- ✅ Frontend muestra ambas notificaciones

---

### Caso 6: Validación de Roles y Permisos

**Objetivo**: Verificar control de acceso correcto

**Precondiciones**:
- ✅ 3 usuarios: Admin, Cuidador, Usuario Final
- ✅ Todos logueados en diferentes browsers/incógnito

**Pasos**:

1. **Usuario Final intenta acceder a /admin**
   ```
   GET http://192.168.1.103:4200/admin
   
   Esperado: Redirección a /dashboard
   No error en consola
   ```

2. **Cuidador intenta crear nuevo usuario**
   ```
   1. Click en "👥 Usuarios"
   2. Click "+ Nuevo Usuario"
   
   Esperado: Botón deshabilitado o error 403
   ```

3. **Admin puede crear usuario**
   ```
   1. Click en "👥 Usuarios"
   2. Click "+ Nuevo Usuario"
   3. Rellenar formulario
   4. POST /api/usuarios (status 201)
   
   Esperado: Éxito
   ```

4. **Validación en Backend**
   ```bash
   # Middleware de autenticación debe validar:
   
   POST /api/usuarios
   - Header: Authorization: Bearer <token>
   - Decode JWT: { role: "ADMIN" }
   - Check role: role !== "ADMIN" → 403 Forbidden
   
   GET /api/usuarios/2/alertas (cuidador)
   - Header: Authorization: Bearer <token>
   - Decode JWT: { id: 5, role: "CUIDADOR" }
   - Check permissions: usuario_id=2 asignado a cuidador_id=5
   - Si OK → 200, Si NO → 403
   ```

**Criterios de Éxito**:
- ✅ Usuario Final no accede a panel admin
- ✅ Cuidador solo ve sus usuarios asignados
- ✅ Admin accede a todo
- ✅ JWT token validado correctamente

---

## Procedimiento de Ejecución {#procedimiento}

### Antes de Ejecutar

**Checklist Pre-Prueba:**

```bash
# 1. Verificar Backend
cd backend
npm run build
npm start &  # O npm run dev
# Esperado: "Server running on http://localhost:3000"

# 2. Verificar Frontend
cd frontend
npm start &
# Esperado: "Compiled successfully" + http://localhost:4200

# 3. Verificar BD
psql -U postgres -d caidas_test -c "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema='public';"
# Esperado: tables = 7 (usuarios, cuidadores, dispositivos, alertas, usuario_cuidador, etc)

# 4. Verificar ESP32
pio device monitor -b 115200 --port COM3
# Esperado: "WiFi connecting..."

# 5. Verificar conectividad
ping 192.168.1.101  # ESP32
# Esperado: Reply from 192.168.1.101: bytes=32 time=15ms
```

### Durante Ejecución

**Logging Centralizado:**

```bash
# Terminal Principal: Monitorear todos los componentes
# Terminal 1: Backend
cd backend && npm run dev > backend.log 2>&1

# Terminal 2: Frontend
cd frontend && npm start > frontend.log 2>&1

# Terminal 3: ESP32
pio device monitor -b 115200 --port COM3 > esp32.log

# Terminal 4: Base de datos (watch)
watch -n 1 'psql -U postgres -d caidas_test -c "SELECT COUNT(*) as pending_alerts FROM alertas WHERE leida=FALSE;"'

# Terminal 5: Network traffic (opcional, tcpdump o Wireshark)
tcpdump -i Wi-Fi host 192.168.1.101 or host 192.168.1.100
```

### Reporte de Resultados

**Crear reporte después de cada caso:**

```markdown
## Caso 1: Detección de Caída Simulada
**Fecha**: 2024-11-15
**Ejecutado por**: Ingeniero QA
**Resultado**: ✅ PASÓ

| Métrica | Esperado | Actual | Estado |
|---------|----------|--------|--------|
| Tiempo detectión | < 500ms | 347ms | ✅ |
| Tiempo a Backend | < 2s | 1.2s | ✅ |
| Notificación Frontend | < 1s | 834ms | ✅ |
| BD actualizada | Inmediato | 45ms | ✅ |

**Logs**: Adjuntos en `backend.log` líneas 234-250

**Evidencia**: Screenshot en `evidence/caso1_screenshot.png`
```

---

## Criterios de Aceptación {#criterios}

### Para Producción

| Criterio | Requerimiento | Umbral de Aceptación |
|----------|--------------|----------------------|
| **Latencia de Alerta** | Caída → Backend | < 500ms |
| **Latencia Total** | Caída → Notificación UI | < 2 segundos |
| **Confiabilidad** | Alertas recibidas correctamente | 99.5% |
| **Recuperación** | Reconexión WiFi | < 60 segundos |
| **Base de Datos** | Transacciones consistentes | 100% |
| **Rol & Permisos** | Seguridad de acceso | 100% (sin bypass) |
| **Falsos Positivos** | Tasa aceptable | < 10% |
| **Disponibilidad** | Uptime del sistema | > 99.0% |

### Matriz de Cobertura {#matriz}

| Caso de Prueba | Prioridad | Estado | Fecha | Responsable | Notas |
|---|---|---|---|---|---|
| 1. Detección Caída | 🔴 CRÍTICA | ⏳ Pendiente | | | |
| 2. Confirmación Alerta | 🟠 ALTA | ⏳ Pendiente | | | |
| 3. Cancelación Falsa Alarma | 🟠 ALTA | ⏳ Pendiente | | | |
| 4. Persistencia Desconexión | 🟡 MEDIA | ⏳ Pendiente | | | |
| 5. Múltiples Alertas | 🟡 MEDIA | ⏳ Pendiente | | | |
| 6. Roles y Permisos | 🟠 ALTA | ⏳ Pendiente | | | |

### Firma de Aceptación

```
Todos los casos PASADOS → Sistema ACEPTADO para producción

Tester Responsable: _____________________ Fecha: _______
Project Manager: ________________________ Fecha: _______
Cliente: ________________________________ Fecha: _______
```

