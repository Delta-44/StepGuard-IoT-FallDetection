# 📊 Grafana - Guía de Visualización y Monitoreo StepGuard

## 📋 Índice
1. [Introducción](#introducción)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [Acceso a Grafana](#acceso-a-grafana)
4. [Dashboards Disponibles](#dashboards-disponibles)
5. [Usos Más Útiles para el Proyecto](#usos-más-útiles-para-el-proyecto)
6. [Personalización](#personalización)
7. [Alertas y Notificaciones](#alertas-y-notificaciones)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

Grafana es una plataforma de análisis y visualización de datos que te permite monitorear en tiempo real el funcionamiento del sistema StepGuard. Conectado directamente a tu base de datos PostgreSQL, proporciona dashboards interactivos para supervisar caídas, dispositivos, notificaciones y más.

### ¿Por qué usar Grafana en StepGuard?

- **Monitoreo en tiempo real** de eventos de caída
- **Identificación rápida** de dispositivos con problemas
- **Análisis de patrones** de caídas por horario, usuario y severidad
- **Seguimiento de notificaciones** y tiempos de respuesta
- **Auditoría completa** del sistema
- **Toma de decisiones basada en datos** históricos

---

## ⚙️ Instalación y Configuración

### Paso 1: Verificar archivos de configuración

Asegúrate de que existan estos archivos en tu proyecto:

```
backend/
├── docker-compose.yml          # Configuración de Grafana
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── datasource.yml  # Conexión a PostgreSQL
│   │   └── dashboards/
│   │       └── dashboard.yml   # Configuración de dashboards
│   └── dashboards/
│       ├── 01-general-overview.json
│       ├── 02-fall-analysis.json
│       ├── 03-devices-monitoring.json
│       └── 04-notifications.json
```

### Paso 2: Levantar los servicios

Desde el directorio `backend/`, ejecuta:

```bash
# Levantar todos los servicios (incluido Grafana)
docker-compose up -d

# Verificar que Grafana esté corriendo
docker-compose ps
```

Deberías ver:
```
stepguard-grafana    Up    0.0.0.0:3000->3000/tcp
```

### Paso 3: Verificar logs (opcional)

Si encuentras algún problema:

```bash
docker-compose logs grafana
```

---

## 🔐 Acceso a Grafana

### Credenciales por defecto

- **URL:** http://localhost:3000
- **Usuario:** `admin`
- **Contraseña:** `admin123`

> ⚠️ **Importante:** En producción, cambia estas credenciales inmediatamente.

### Cambiar la contraseña

1. Accede a Grafana
2. Click en el icono de tu perfil (esquina inferior izquierda)
3. Selecciona **Profile**
4. Click en **Change Password**

### Variables de entorno (opcional)

Puedes cambiar las credenciales antes de levantar los servicios editando el archivo `docker-compose.yml`:

```yaml
environment:
  - GF_SECURITY_ADMIN_USER=tu_usuario
  - GF_SECURITY_ADMIN_PASSWORD=tu_contraseña_segura
```

---

## 📈 Dashboards Disponibles

Grafana viene preconfigurado con **4 dashboards especializados** para StepGuard:

### 1. 📊 Dashboard General (Overview)

**Archivo:** `01-general-overview.json`  
**UID:** `stepguard-general`

#### Características:
- **KPIs principales**: Total usuarios, dispositivos activos, caídas hoy, alertas pendientes
- **Historial de caídas**: Gráfico temporal de caídas detectadas
- **Distribución por severidad**: Gráfico circular de caídas low/medium/high/critical
- **Últimas caídas detectadas**: Tabla con las 50 caídas más recientes

#### ¿Cuándo usarlo?
- Vista rápida del estado general del sistema
- Punto de partida para análisis más profundos
- Presentaciones a stakeholders
- Monitoreo diario básico

---

### 2. 🚨 Dashboard de Análisis de Caídas

**Archivo:** `02-fall-analysis.json`  
**UID:** `stepguard-caidas`

#### Características:
- **Total caídas en período seleccionado**
- **Caídas críticas** contabilizadas
- **Promedio de impactos** por caída
- **Caídas por severidad en el tiempo**: Gráfico de barras apiladas
- **Estado de las caídas**: Distribución pendiente/atendida/falsa alarma
- **Tipo de detección**: SOS manual vs. caída automática
- **Magnitud de impactos**: Gráfico de línea con datos del acelerómetro
- **Top 10 usuarios con más caídas**
- **Distribución por hora del día**

#### ¿Cuándo usarlo?
- Análisis detallado de patrones de caída
- Identificación de usuarios de alto riesgo
- Evaluación de la efectividad del sistema de detección
- Informes médicos o de cuidado
- Análisis de horarios críticos (ej: más caídas por la noche)

---

### 3. 🔌 Dashboard de Monitoreo de Dispositivos

**Archivo:** `03-devices-monitoring.json`  
**UID:** `stepguard-dispositivos`

#### Características:
- **Total dispositivos registrados**
- **Dispositivos activos/inactivos**
- **Total impactos registrados** por todos los dispositivos
- **Estado de todos los dispositivos**: Tabla completa con MAC, nombre, usuario asignado
- **Actividad de dispositivos**: Gráfico temporal de eventos por dispositivo
- **Estadísticas de dispositivos**: Tabla con total eventos, críticos, último evento
- **Distribución de eventos por dispositivo**: Gráfico circular
- **Tiempo sin conexión**: Tabla con alertas de dispositivos desconectados

#### ¿Cuándo usarlo?
- Mantenimiento preventivo de hardware
- Detección de dispositivos con mal funcionamiento
- Identificación de dispositivos desconectados
- Análisis de vida útil del hardware
- Planificación de reemplazos

---

### 4. 📧 Dashboard de Notificaciones y Alertas

**Archivo:** `04-notifications.json`  
**UID:** `stepguard-notificaciones`

#### Características:
- **Total notificaciones enviadas**
- **Notificaciones pendientes, enviadas y fallidas**
- **Notificaciones por estado en el tiempo**
- **Distribución por tipo**: Email, SMS, Push, App
- **Tiempo de entrega**: Análisis de latencia
- **Notificaciones por cuidador**: Tabla con estadísticas
- **Historial completo**: Últimas 100 notificaciones
- **Tasa de envío**: Frecuencia de notificaciones por hora

#### ¿Cuándo usarlo?
- Verificar que las notificaciones lleguen correctamente
- Identificar problemas de entrega
- Analizar tiempos de respuesta de cuidadores
- Auditar comunicaciones del sistema
- Optimizar el sistema de alertas

---

## 💡 Usos Más Útiles para el Proyecto StepGuard

### 1. **Monitoreo en Tiempo Real (Control Room)**

**Dashboard recomendado:** Dashboard General  
**Configuración:** Pantalla completa, auto-refresh 30s

Ideal para tener un monitor dedicado en la oficina o centro de control mostrando constantemente el estado del sistema.

**Setup:**
1. Accede al Dashboard General
2. Presiona `F` para pantalla completa
3. Click en el icono del reloj → Configurar refresh automático a 30s
4. Conecta a un monitor/TV

---

### 2. **Análisis de Seguridad y Prevención**

**Dashboard recomendado:** Análisis de Caídas  
**Período:** Últimos 30-90 días

Identifica patrones para prevención:
- ¿Qué usuarios tienen más caídas?
- ¿A qué horas ocurren más caídas?
- ¿Cuál es la severidad promedio?
- ¿Cuántas son falsas alarmas?

**Acciones basadas en datos:**
- Aumentar supervisión en horarios críticos
- Evaluar entorno del usuario (iluminación, obstáculos)
- Ajustar sensibilidad de dispositivos con muchas falsas alarmas

---

### 3. **Mantenimiento de Dispositivos**

**Dashboard recomendado:** Monitoreo de Dispositivos  
**Frecuencia:** Revisión semanal

Identifica dispositivos que necesitan atención:
- Dispositivos desconectados por más de 24h
- Dispositivos con alta tasa de eventos (posible mal funcionamiento)
- Dispositivos sin actividad reciente (batería agotada, hardware dañado)

**Flujo de trabajo:**
1. Filtra dispositivos inactivos
2. Revisa "Tiempo sin conexión"
3. Contacta al usuario o técnico para mantenimiento

---

### 4. **Reportes para Familiares y Médicos**

**Dashboards recomendados:** Dashboard General + Análisis de Caídas  
**Exportación:** PDF o captura de pantalla

Genera reportes mensuales/trimestrales:
1. Configura el rango de tiempo (ej: últimos 30 días)
2. Click en el título del dashboard → Share → Export to PDF
3. Envía a familiares o incluye en informes médicos

**Datos relevantes a destacar:**
- Número total de caídas
- Severidad de las caídas
- Tiempo de respuesta promedio
- Patrones de horario

---

### 5. **Evaluación de Desempeño del Sistema**

**Dashboards recomendados:** Notificaciones + Análisis de Caídas  
**Métricas clave:**

| Métrica | Objetivo | Dashboard |
|---------|----------|-----------|
| Tiempo de entrega de notificaciones | < 5 segundos | Notificaciones |
| Tasa de falsas alarmas | < 15% | Análisis de Caídas |
| Dispositivos activos | > 95% | Dispositivos |
| Alertas pendientes | < 5 simultáneas | General |
| Tiempo respuesta cuidadores | < 10 minutos | Notificaciones |

**Uso:**
- Reuniones semanales de equipo
- Identificación de cuellos de botella
- Justificación de mejoras en el sistema

---

### 6. **Auditoría y Cumplimiento**

**Datos disponibles:**
- Historial completo de eventos
- Registro de notificaciones enviadas
- Estado de dispositivos en el tiempo

**Casos de uso:**
- Investigación de incidentes específicos
- Cumplimiento de normativas de cuidado de salud
- Evidencia para aseguradoras
- Defensa legal en caso de disputas

---

## 🎨 Personalización

### Modificar Rango de Tiempo

En cualquier dashboard:
1. Click en el selector de tiempo (esquina superior derecha)
2. Selecciona un rango predefinido o personalizado
3. Los datos se actualizarán automáticamente

### Crear un Nuevo Panel

1. Click en el icono **Add Panel** (➕)
2. Selecciona el tipo de visualización
3. Escribe tu consulta SQL en el editor de queries
4. Personaliza el estilo y opciones
5. Guarda el panel

**Ejemplo de Query:** Contar usuarios por edad

```sql
SELECT 
  CASE 
    WHEN calcular_edad(fecha_nacimiento) < 70 THEN '<70'
    WHEN calcular_edad(fecha_nacimiento) BETWEEN 70 AND 79 THEN '70-79'
    WHEN calcular_edad(fecha_nacimiento) BETWEEN 80 AND 89 THEN '80-89'
    ELSE '90+'
  END as "Rango de Edad",
  COUNT(*) as "Cantidad"
FROM usuarios
GROUP BY "Rango de Edad";
```

### Duplicar un Dashboard

1. Click en **Dashboard settings** (⚙️)
2. Selecciona **Save as**
3. Dale un nombre nuevo
4. Modifica a tu gusto sin afectar el original

---

## 🔔 Alertas y Notificaciones

Grafana puede enviar alertas cuando se cumplen ciertas condiciones.

### Configurar una Alerta

**Ejemplo:** Alertar cuando hay más de 5 caídas críticas en 1 hora

1. Edita el panel "Caídas Críticas"
2. Ve a la pestaña **Alert**
3. Click en **Create Alert Rule**
4. Configura la condición:
   ```
   WHEN last() OF query(A, 1h, now) IS ABOVE 5
   ```
5. Añade canales de notificación (Email, Slack, Webhook)
6. Guarda

### Canales de Notificación Recomendados

- **Email:** Para alertas no urgentes
- **Slack/Discord:** Para equipo de operaciones
- **Webhook:** Para integrar con tu backend y enviar notificaciones a cuidadores

**Configurar email:**
1. **Configuration** (⚙️) → **Alerting** → **Contact Points**
2. **New Contact Point**
3. Selecciona **Email**
4. Configura servidor SMTP

---

## 🛠️ Troubleshooting

### Problema: No puedo acceder a Grafana

**Solución:**
```bash
# Verificar que el contenedor esté corriendo
docker-compose ps

# Ver logs de Grafana
docker-compose logs grafana

# Reiniciar Grafana
docker-compose restart grafana
```

---

### Problema: No aparecen datos en los dashboards

**Causas posibles:**
1. **La base de datos está vacía**
   - Verifica que haya datos ejecutando consultas directas en PostgreSQL
   - Inserta datos de prueba si es necesario

2. **Rango de tiempo mal configurado**
   - Asegúrate de seleccionar un rango que incluya tus datos
   - Prueba con "Last 90 days" o "All time"

3. **Datasource mal configurado**
   - Ve a **Configuration** → **Data Sources**
   - Click en "StepGuard PostgreSQL"
   - Presiona **Test** para verificar conexión

**Comando para verificar datos:**
```bash
docker exec -it stepguard-postgres psql -U postgres -d stepguard -c "SELECT COUNT(*) FROM eventos_caida;"
```

---

### Problema: Error de conexión a PostgreSQL

**Verificar conectividad:**
```bash
# Entrar al contenedor de Grafana
docker exec -it stepguard-grafana sh

# Probar conexión a PostgreSQL
nc -zv postgres 5432
```

**Si falla:**
1. Verifica que PostgreSQL esté corriendo: `docker-compose ps postgres`
2. Asegúrate de que ambos contenedores estén en la misma red: `stepguard-network`
3. Revisa credenciales en `grafana/provisioning/datasources/datasource.yml`

---

### Problema: Los dashboards no se cargan automáticamente

**Diagnóstico:**
```bash
# Verificar que los archivos JSON estén montados
docker exec -it stepguard-grafana ls -la /var/lib/grafana/dashboards

# Verificar configuración de provisioning
docker exec -it stepguard-grafana cat /etc/grafana/provisioning/dashboards/dashboard.yml
```

**Solución:**
1. Detén los servicios: `docker-compose down`
2. Borra el volumen de Grafana: `docker volume rm backend_grafana_data`
3. Levanta de nuevo: `docker-compose up -d`

---

### Problema: Cambié un dashboard y se resetea

**Causa:** Los dashboards provisionados desde archivos JSON son de solo lectura en cuanto a persistencia.

**Solución:**
1. **Opción A (Guardar como nuevo):**
   - Haz tus cambios
   - Click en **Save** → **Save as**
   - Dale un nombre diferente

2. **Opción B (Actualizar JSON):**
   - Haz tus cambios en Grafana
   - Click en **Dashboard settings** (⚙️)
   - Selecciona **JSON Model**
   - Copia el JSON
   - Actualiza el archivo en `backend/grafana/dashboards/`
   - Reinicia Grafana: `docker-compose restart grafana`

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [PostgreSQL Datasource](https://grafana.com/docs/grafana/latest/datasources/postgres/)
- [Dashboard Best Practices](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/best-practices/)

### Consultas SQL Útiles

#### Caídas en las últimas 24 horas
```sql
SELECT COUNT(*) FROM eventos_caida 
WHERE fecha_hora >= NOW() - INTERVAL '24 hours';
```

#### Usuarios más vulnerables (más de 3 caídas en 30 días)
```sql
SELECT u.nombre, COUNT(ec.id) as total_caidas
FROM usuarios u
JOIN eventos_caida ec ON u.id = ec.usuario_id
WHERE ec.fecha_hora >= NOW() - INTERVAL '30 days'
GROUP BY u.nombre
HAVING COUNT(ec.id) > 3
ORDER BY total_caidas DESC;
```

#### Tasa de respuesta de cuidadores
```sql
SELECT 
  c.nombre,
  COUNT(ec.id) as alertas_atendidas,
  AVG(EXTRACT(EPOCH FROM (ec.fecha_atencion - ec.fecha_hora))/60) as tiempo_respuesta_promedio_minutos
FROM eventos_caida ec
JOIN cuidadores c ON ec.atendido_por = c.id
WHERE ec.fecha_atencion IS NOT NULL
GROUP BY c.nombre
ORDER BY tiempo_respuesta_promedio_minutos ASC;
```

---

## 🎯 Mejores Prácticas

1. **Configura refresh automático** en dashboards de monitoreo en tiempo real (30s - 1min)
2. **No uses refresh muy rápido** en dashboards de análisis histórico (innecesario)
3. **Crea usuarios específicos** para diferentes roles (admin, operador, viewer)
4. **Haz backups** de tus dashboards personalizados (exporta JSON regularmente)
5. **Usa variables** para filtrar por usuario, dispositivo o cuidador específico
6. **Documenta tus consultas SQL** personalizadas con comentarios
7. **Establece alertas** para condiciones críticas (muchas alertas pendientes, dispositivos offline)

---

## 🚀 Siguientes Pasos

1. **Explora cada dashboard** con datos reales de tu sistema
2. **Configura alertas** para las métricas más críticas
3. **Personaliza los dashboards** según las necesidades de tu equipo
4. **Integra con tu backend** usando las APIs de Grafana si es necesario
5. **Capacita a tu equipo** en el uso de Grafana para la toma de decisiones

---

## 📞 Soporte

Para problemas específicos del proyecto StepGuard:
- Revisa los logs: `docker-compose logs grafana`
- Verifica la conectividad con PostgreSQL
- Consulta esta documentación

Para soporte de Grafana:
- [Community Forums](https://community.grafana.com/)
- [GitHub Issues](https://github.com/grafana/grafana/issues)

---

**Última actualización:** Febrero 2026  
**Versión de Grafana:** Latest (compatible con 10.x+)  
**Proyecto:** StepGuard - Sistema de Detección de Caídas
