# 📸 Cómo Actualizar el Snapshot del Dashboard

## Estado Actual

**Snapshot URL:** `https://delta44.grafana.net/dashboard/snapshot/GmA9TpUGTdSe1JVDUNpZ2efyuVLgGvb8`

**Última actualización:** 9 de febrero de 2026

**Ubicación en el código:** `frontend/src/app/pages/analytics/analytics.component.ts` (línea ~56)

---

## ¿Qué es un Snapshot?

Un snapshot es una **captura estática** del dashboard con los datos actuales:
- ✅ Sin problemas de permisos o autenticación
- ✅ Rápido de cargar y compartir
- ✅ Siempre funciona
- ❌ Los datos NO se actualizan automáticamente
- ❌ Debes crear un nuevo snapshot manualmente

**IMPORTANTE:** Grafana Cloud bloquea iframes con `X-Frame-Options: deny`, por lo que el dashboard se abre en una nueva pestaña en lugar de mostrarse embebido en la aplicación.

---

## ¿Cuándo actualizar el snapshot?

Crea un nuevo snapshot cuando:
- Los datos hayan cambiado significativamente
- Quieras mostrar información más reciente
- Hayas modificado el diseño del dashboard
- El snapshot actual tenga más de 1 semana (recomendado)

---

## Pasos para Actualizar el Snapshot

### 1. Crear Nuevo Snapshot en Grafana Cloud

1. Ve a: **https://delta44.grafana.net**
2. Abre el dashboard **"StepGuard - General v2"** (el privado que funciona)
3. Asegúrate de que muestre los datos más recientes
4. Click en el botón **"Share"** (icono compartir, arriba a la derecha)
5. Selecciona la pestaña **"Snapshot"**
6. Configura:
   - **Snapshot name:** `StepGuard Analytics - [Fecha]`
   - **Expire:** `Never` (o el tiempo que quieras)
   - **Timeout:** `60 seconds`
7. Click en **"Publish snapshot"**
8. **Copia la URL completa** que aparece
   - Ejemplo: `https://delta44.grafana.net/dashboard/snapshot/NUEVO_ID_AQUI`

### 2. Actualizar el Código

1. Abre el archivo: `frontend/src/app/pages/analytics/analytics.component.ts`
2. Busca la línea con `snapshotUrl`
3. Reemplaza la URL antigua con la nueva:

```typescript
const snapshotUrl = 'https://delta44.grafana.net/dashboard/snapshot/NUEVO_ID_AQUI';
```

4. Guarda el archivo

### 3. Verificar

1. Si el frontend está corriendo, se actualizará automáticamente
2. Si no, inicia el frontend: `cd frontend && npm start`
3. Abre en el navegador: **http://localhost:4200/analytics**
4. Verifica que muestre los datos actualizados

---

## Cronograma de Actualización Sugerido

- **Desarrollo/Testing:** Actualizar cada 2-3 días
- **Producción:** Actualizar semanalmente o cuando haya cambios importantes
- **Dashboard estable:** Actualizar mensualmente

---

## Alternativa: Dashboard Público Dinámico

Si prefieres datos en tiempo real sin crear snapshots:
1. Revisa `GRAFANA_CLOUD_FIX.md`
2. Habilita "Allow public datasource access" en Grafana Cloud
3. Usa la configuración de Public Dashboard en lugar de Snapshot

**Ventajas del Dinámico:**
- Datos actualizados automáticamente
- Filtrado por rol (admin, caregiver, patient)

**Desventajas del Dinámico:**
- Puede no funcionar según el plan de Grafana Cloud
- Errores 400 si no está bien configurado

---

## Historial de Snapshots

| Fecha | ID del Snapshot | Notas |
|-------|----------------|-------|
| 2026-02-09 | `GmA9TpUGTdSe1JVDUNpZ2efyuVLgGvb8` | Primera versión funcional |

*(Actualiza esta tabla cada vez que crees un nuevo snapshot)*

---

## Contacto y Ayuda

Si tienes problemas:
1. Verifica que el dashboard privado muestre datos en Grafana Cloud
2. Asegúrate de copiar la URL completa del snapshot
3. Revisa la consola del navegador para errores
4. Lee `GRAFANA_CLOUD_FIX.md` para más detalles
