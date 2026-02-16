# 🌐 Configuración Grafana Cloud - StepGuard

> **✅ CONFIGURACIÓN COMPLETADA**  
> Tu proyecto ya está configurado para usar Grafana Cloud.  
> **Stack**: https://delta44.grafana.net  
> **Dashboard público**: https://delta44.grafana.net/public-dashboards/e42214e8f67247f68f57f6cb0a729d7c

Esta guía te ayudará a configurar Grafana Cloud (gratis) para visualizar datos de Neon desde cualquier dispositivo sin necesidad de Docker local.

---

## ✅ Estado Actual

- ✅ Cuenta Grafana Cloud: **delta44.grafana.net**
- ✅ Dashboard público configurado
- ✅ Frontend actualizado para usar Grafana Cloud
- ✅ Grafana local desactivado (no necesario)

**Acceso directo al dashboard**:
```
https://delta44.grafana.net/public-dashboards/e42214e8f67247f68f57f6cb0a729d7c
```

---

## ✅ Ventajas de Grafana Cloud

- ✅ **Gratis**: Plan Free Forever (10k series, 50GB logs, 50GB traces)
- ✅ **Sin instalación local**: No necesitas Docker ni puerto 3001
- ✅ **Compartido**: Todos los compañeros ven el mismo dashboard
- ✅ **Accesible desde cualquier lugar**: URL pública
- ✅ **Mantenimiento cero**: Grafana Labs lo mantiene actualizado

---

## 📋 Pasos de Configuración

### 1. Crear cuenta en Grafana Cloud

1. Ve a: https://grafana.com/auth/sign-up/create-user
2. Registra con tu email (o continúa con Google/GitHub)
3. Completa el formulario:
   - **Organization name**: `StepGuard` (o el nombre de tu equipo)
   - **Region**: `Europe West` (Frankfurt - más cercano a Neon)
4. Click en **"Complete Setup"**
5. **Guarda la URL de tu stack**: `https://TUNOMBRE.grafana.net`

---

### 2. Configurar Datasource de Neon

1. En Grafana Cloud, ve a **Connections** > **Data sources**
2. Click en **Add data source**
3. Busca y selecciona **PostgreSQL**
4. Configura con estos valores:

   ```
   Name: Neon StepGuard
   Host: ep-jolly-forest-ageh8mo5-pooler.c-2.eu-central-1.aws.neon.tech:5432
   Database: neondb
   User: neondb_owner
   Password: npg_X2iSWEt8YZrK
   TLS/SSL Mode: require
   Version: 15.0+
   ```

5. Click en **Save & test**
6. Deberías ver: ✅ **"Database Connection OK"**

> ⚠️ **IMPORTANTE**: Si ves error de conexión, verifica que tu IP esté permitida en Neon:
> - Ve a: https://console.neon.tech/app/projects
> - Selecciona tu proyecto `neondb`
> - Ve a **Settings** > **IP Allow**
> - Agrega `0.0.0.0/0` (permite conexiones desde cualquier IP, incluyendo Grafana Cloud)

---

### 3. Importar Dashboard

Tienes el dashboard en: `backend/monitoring/grafana/provisioning/dashboards/stepguard-general-v2.json`

**Opción A: Importar desde archivo**
1. En Grafana Cloud, ve a **Dashboards** > **Import**
2. Click en **Upload JSON file**
3. Selecciona: `backend/monitoring/grafana/provisioning/dashboards/stepguard-general-v2.json`
4. En **"Neon Postgres"**, selecciona el datasource que creaste: **Neon StepGuard**
5. Click en **Import**

**Opción B: Crear desde cero (si hay problemas con import)**
1. En Grafana Cloud, ve a **Dashboards** > **New** > **New Dashboard**
2. Agrega paneles con las queries del archivo JSON
3. Guarda el dashboard con nombre: `StepGuard General v2`

---

### 4. Configurar Permisos y Compartir

**Para hacer el dashboard público (opcional):**
1. Abre el dashboard
2. Click en **Share** (icono compartir arriba derecha)
3. Tab **Public dashboard**
4. Toggle **Enable public dashboard**
5. **Guarda la URL pública**: `https://TUNOMBRE.grafana.net/public-dashboards/...`

✅ **YA CONFIGURADO**: https://delta44.grafana.net/public-dashboards/e42214e8f67247f68f57f6cb0a729d7c


**Para dar acceso a compañeros:**
1. Ve a **Administration** > **Users**
2. Click en **Invite user**
3. Agrega emails de tus compañeros
4. Rol: `Viewer` (solo lectura) o `Editor` (puede modificar)

---

### 5. Obtener URL de Embed

Una vez importado el dashboard:

1. Abre el dashboard: `StepGuard General v2`
2. Mira la URL en el navegador:
   ```
   https://TUNOMBRE.grafana.net/d/DASHBOARD_UID/stepguard-general-v2
   ```
3. **Copia el DASHBOARD_UID** (ejemplo: `ae3h8k2p`)
4. La URL completa para embed será:
   ```
   https://TUNOMBRE.grafana.net/d/DASHBOARD_UID/stepguard-general-v2?orgId=1&from=now-7d&to=now&theme=dark&kiosk
   ```

---

### 6. Actualizar Frontend

Ahora actualiza el archivo de environment del frontend con tu URL de Grafana Cloud:

**Archivo**: `frontend/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  // Reemplaza con tu URL de Grafana Cloud
  grafanaUrl: 'https://TUNOMBRE.grafana.net',
  realESP32Mac: 'EC:E3:34:DA:1C:08'
};
```

**Archivo**: `frontend/src/app/pages/analytics/analytics.component.ts`

Cambia:
```typescript
const dashboardUid = 'stepguard-general-v2';
```

Por tu UID real:
```typescript
const dashboardUid = 'DASHBOARD_UID'; // El que copiaste de la URL
```

---

## 🔐 Seguridad y Mejores Prácticas

### Credenciales de Neon

**NUNCA** subas las credenciales de Neon a repositorios públicos o compartidos. Opciones:

1. **Crear usuarios de solo lectura en Neon**:
   ```sql
   CREATE USER grafana_viewer WITH PASSWORD 'secure_password_here';
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO grafana_viewer;
   ```
   Usa estas credenciales en Grafana Cloud en lugar de `neondb_owner`.

2. **IP Allow List en Neon**:
   - Ve a Neon Console > Settings > IP Allow
   - Agrega solo las IPs de Grafana Cloud (más seguro que `0.0.0.0/0`)
   - IPs de Grafana Cloud EU: Consulta https://grafana.com/docs/grafana-cloud/reference/allow-list/

3. **Variables de entorno en frontend**:
   - Para producción, usa variables de entorno
   - No hardcodees URLs en el código

---

## 🧪 Verificación

Verifica que todo funcione:

1. ✅ Datasource conectado a Neon: **Database Connection OK**
2. ✅ Dashboard importado y visible
3. ✅ Paneles muestran datos (usuarios, caídas, dispositivos)
4. ✅ Frontend puede hacer embed del dashboard
5. ✅ Compañeros pueden acceder con sus cuentas

---

## 🆘 Troubleshooting

### Error: "Database connection failed"
- Verifica credenciales en datasource
- Verifica **IP Allow** en Neon (debe incluir `0.0.0.0/0` o IPs de Grafana Cloud)
- Verifica que `sslmode` sea `require`

### Dashboard muestra "No data"
- Verifica que el datasource seleccionado sea el correcto
- Verifica queries SQL en cada panel
- Verifica que hay datos en las tablas de Neon

### Frontend no carga iframe
- Verifica que `grafanaUrl` en environment.ts sea correcto
- Verifica que el dashboard UID sea correcto
- Habilita **Public dashboard** si hay errores de CORS

### Compañeros no pueden acceder
- Invita usuarios desde **Administration** > **Users**
- O habilita **Public dashboard** para acceso sin cuenta

---

## 📊 Dashboard Incluido

El dashboard `stepguard-general-v2.json` incluye:

| Panel | Query | Descripción |
|-------|-------|-------------|
| **Total Caídas** | `SELECT COUNT(*) FROM eventos_caida WHERE fecha_hora >= NOW() - INTERVAL '7 days'` | Contador últimos 7 días |
| **Usuarios Activos** | `SELECT COUNT(*) FROM usuarios` | Total usuarios en sistema |
| **Dispositivos Activos** | `SELECT COUNT(*) FROM dispositivos` | Dispositivos conectados |
| **Tendencia Caídas** | Time series de eventos_caida | Gráfico temporal |
| **Últimas Caídas** | `SELECT * FROM eventos_caida ORDER BY fecha_hora DESC LIMIT 50` | Tabla con eventos recientes |
| **Top Usuarios** | Usuarios con más caídas | Ranking |
| **Estado Dispositivos** | MAC, batería, última conexión | Tabla de dispositivos |

---

## 💰 Límites del Plan Gratuito

Grafana Cloud Free Forever:
- ✅ **Métricas**: 10,000 series activas
- ✅ **Logs**: 50 GB/mes
- ✅ **Traces**: 50 GB/mes
- ✅ **Usuarios**: Ilimitados (Viewers)
- ✅ **Dashboards**: Ilimitados
- ✅ **Alertas**: 100 queries/mes

Para StepGuard, esto es **más que suficiente** (solo consultas SQL a Postgres).

---

## 🎯 Siguientes Pasos

Después de configurar Grafana Cloud:

1. ✅ Elimina contenedor local: `docker compose down grafana`
2. ✅ Elimina volumen: `docker volume rm backend_grafana_data`
3. ✅ Actualiza README con nueva URL de Grafana Cloud
4. ✅ Comparte URL con tu equipo
5. ✅ Configura alertas (opcional) desde Grafana Cloud

---

## 📚 Recursos

- [Grafana Cloud Docs](https://grafana.com/docs/grafana-cloud/)
- [PostgreSQL Datasource](https://grafana.com/docs/grafana/latest/datasources/postgres/)
- [Dashboard Import](https://grafana.com/docs/grafana/latest/dashboards/manage-dashboards/#import-a-dashboard)
- [Public Dashboards](https://grafana.com/docs/grafana/latest/dashboards/dashboard-public/)
