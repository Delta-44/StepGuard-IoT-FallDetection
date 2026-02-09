# GUÍA: Configurar Dashboard Público en Grafana Cloud

## ❌ PROBLEMA ACTUAL
- El dashboard **privado** muestra datos correctamente ✅
- El dashboard **público** da errores 400 en todas las queries ❌
- **Causa:** El datasource NO está habilitado para acceso público

## ✅ SOLUCIÓN PASO A PASO

### PASO 1: Verificar que el Datasource existe

1. Ve a: **https://delta44.grafana.net/connections/datasources**
2. Busca en la lista: **"Neon StepGuard"** (tipo PostgreSQL)
3. Si NO existe, créalo (continúa en PASO 1.1)
4. Si SÍ existe, salta al PASO 2

#### PASO 1.1: Crear Datasource (si no existe)

1. Click en **"Add data source"**
2. Busca y selecciona **PostgreSQL**
3. Configura los siguientes campos:

   ```
   Name: Neon StepGuard
   
   Host: ep-jolly-forest-ageh8mo5-pooler.c-2.eu-central-1.aws.neon.tech:5432
   
   Database: neondb
   
   User: neondb_owner
   
   Password: npg_X2iSWEt8YZrK
   
   TLS/SSL Mode: require
   ```

4. Click en **"Save & test"**
5. Deberías ver: ✅ "Database Connection OK"

---

### PASO 2: Importar Dashboard (CORRECTAMENTE)

**⚠️ IMPORTANTE: Este es el paso que está fallando**

1. Elimina el dashboard público actual (si existe):
   - Ve a: https://delta44.grafana.net/dashboards
   - Busca "StepGuard - General v2"
   - Abre el dashboard
   - Click en ⚙️ **Settings**
   - Scroll down y click en **"Delete"**
   - Confirma

2. Importa el nuevo dashboard:
   - Click en **"Dashboards"** (menú lateral)
   - Click en **"Import"**
   - Click en **"Upload JSON file"**
   - Selecciona: `stepguard-general-v2.json`
   
3. **🔴 CRÍTICO - Seleccionar Datasource:**
   
   Verás un campo que dice:
   ```
   Select a data source
   [Dropdown vacío o "None"]
   ```
   
   **DEBES hacer click en ese dropdown y SELECCIONAR:**
   ```
   Neon StepGuard
   ```
   
   **NO** dejes este campo vacío o en "None"
   **SI** lo dejas vacío → errores 400 ❌

4. Click en **"Import"**

---

### PASO 3: Hacer el Dashboard Público

1. Con el dashboard abierto, click en ⚙️ **Settings** (arriba derecha)
2. En el menú lateral izquierdo, busca **"Public dashboard"**
3. Click en **"Public dashboard"**
4. Activa el toggle: **"Enable public dashboard"** ✅

5. **🔴 CRÍTICO - Habilitar consultas públicas:**
   
   Justo debajo del toggle, busca una opción como:
   - **"Allow public datasource access"** 
   - O **"Query data publicly"**
   - O similar (puede variar según versión)
   
   ✅ **ACTIVA** esta opción
   
   Esto permite que el dashboard público ejecute queries al datasource.
   Si NO lo activas → Error 400 en todas las queries ❌

6. Click en **"Save sharing configuration"**
7. Copia el **ID público** que aparece (lo necesitas si cambió)

---

### PASO 4: Configurar el Datasource para Acceso Público

**Si aún tienes errores 400, verifica que el datasource permite acceso público:**

1. Ve a: **https://delta44.grafana.net/connections/datasources**
2. Click en **"Neon StepGuard"**
3. Scroll down hasta la sección de **configuración avanzada**
4. Busca opciones relacionadas con:
   - "Allow queries from public dashboards"
   - "Enable public access"
   - O similar

5. Si encuentras alguna opción relacionada con acceso público, **actívala**
6. Click en **"Save & test"**

**Nota:** Grafana Cloud puede tener restricciones de seguridad en datasources públicos. Si no puedes habilitar acceso público, considera usar el Dashboard Snapshot (alternativa más abajo).

---

### PASO 5: Verificar que Funciona

1. Abre el link público que te da Grafana
2. Deberías ver:
   - ✅ Todos los paneles con DATOS
   - ✅ Números, gráficos, tablas con información
   - ❌ No más errores 400

3. En tu aplicación:
   - Ve a: http://localhost:4200/analytics
   - Deberías ver el dashboard embebido funcionando

---

## 📝 NOTAS IMPORTANTES

### Errores NORMALES (puedes ignorarlos):
- ❌ Faro: Failed to fetch
- ❌ RudderStack deprecated
- ❌ Intercom errors
- ❌ 401/403 en plugins de Grafana
- ❌ net::ERR_BLOCKED_BY_CLIENT

**Estos errores son servicios de telemetría de Grafana Cloud y NO afectan al dashboard.**

### Error que SÍ DEBES arreglar:
- ❌ 400 en `/api/public/dashboards/.../panels/.../query`

**Este error significa que:**
- El datasource NO permite consultas públicas
- O no activaste "Allow public datasource access" en la configuración del public dashboard

---

## 🆘 SI SIGUE SIN FUNCIONAR

Contesta estas preguntas:

1. ¿Existe el datasource "Neon StepGuard" en Grafana Cloud?
2. ¿Al importar, SELECCIONASTE el datasource en el dropdown?
3. ¿El dashboard muestra "No data" o paneles vacíos?
4. ¿Qué errores ves en la consola del navegador?

---

## ✅ CHECKLIST FINAL

- [ ] Datasource "Neon StepGuard" existe en Grafana Cloud
- [ ] Datasource probado con "Save & test" → OK
- [ ] Dashboard importado SELECCIONANDO el datasource
- [ ] Dashboard privado muestra datos correctamente
- [ ] Dashboard configurado como público
- [ ] **ACTIVADO "Allow public datasource access"** en configuración del public dashboard
- [ ] ID público actualizado en el código: `e21392683fce41648311043f2799a528`
- [ ] Al abrir el link público, se ven DATOS (no errores 400)
- [ ] La web en localhost:4200/analytics muestra el dashboard

---

## 🔄 ALTERNATIVA: Dashboard Snapshot (Si public queries no funcionan)

Si Grafana Cloud no permite consultas públicas en tu plan, usa **Dashboard Snapshot**:

### Qué es un Snapshot
- Captura del dashboard con los datos actuales
- No hace queries en tiempo real
- Los datos quedan "congelados"
- Fácil de compartir
- **NOTA:** Grafana Cloud bloquea iframes (`X-Frame-Options: deny`), por lo que el dashboard se abre en una nueva pestaña

### Cómo crear un Snapshot

1. Abre tu dashboard en Grafana Cloud (el privado que funciona)
2. Click en **"Share"** (icono compartir, arriba derecha)
3. Selecciona la pestaña **"Snapshot"**
4. Configura:
   - **Snapshot name:** StepGuard Analytics
   - **Expire:** Never (o el tiempo que quieras)
   - **Timeout:** 60 seconds
5. Click en **"Publish snapshot"**
6. Copia la **URL del snapshot**
7. Actualiza en el código: 
   ```typescript
   // En analytics.component.ts
   const snapshotUrl = 'https://snapshots.raintank.io/dashboard/snapshot/XXXXX';
   ```

### Pros y Contras

✅ **Pros:**
- Funciona sin problemas de permisos
- Rápido de cargar
- No consume recursos del datasource

❌ **Contras:**
- Datos NO actualizados en tiempo real
- Debes crear nuevo snapshot cuando cambien los datos
- El snapshot es público (cualquiera con el link lo ve)

---

## 🎯 RESUMEN

**OPCIÓN 1: Public Dashboard con Datasource (Recomendado)**
- ✅ Dashboard dinámico con datos en tiempo real
- ✅ Los datos se actualizan automáticamente
- ⚠️ Requiere habilitar "Allow public datasource access"
- ⚠️ Si da error 400 → el datasource no permite consultas públicas

**OPCIÓN 2: Dashboard Snapshot (Alternativa)**
- ✅ Siempre funciona, sin problemas de permisos
- ✅ Fácil de compartir y embeber
- ⚠️ Datos estáticos (no actualizados en tiempo real)
- ⚠️ Debes crear nuevo snapshot cuando cambien los datos

---

**Los errores 400 en public dashboards significan:**
1. NO seleccionaste el datasource al importar ❌
2. NO activaste "Allow public datasource access" ❌
3. El plan de Grafana Cloud no permite datasources públicos ❌

**La solución es:**
1. Importar dashboard SELECCIONANDO "Neon StepGuard"
2. Activar "Allow public datasource access" en la configuración del public dashboard
3. Si aún falla → usar Dashboard Snapshot (OPCIÓN 2)

