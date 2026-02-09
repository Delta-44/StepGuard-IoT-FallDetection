# 📊 Grafana Analytics - StepGuard

Monitorización en tiempo real del sistema de detección de caídas.

---

## 🚀 Inicio Rápido

### Arrancar Grafana
```powershell
cd backend
docker compose up -d
```

### Acceso Directo
- **URL**: http://localhost:3001
- **Usuario**: `admin`
- **Contraseña**: `admin123`

---

## 📱 Uso desde la Aplicación

1. **Botón flotante** en la esquina inferior izquierda
2. Click para acceder a `/analytics`
3. Dashboard carga automáticamente según tu rol:
   - **Admin**: Ve todos los datos del sistema
   - **Cuidador**: Ve solo pacientes asignados
   - **Usuario**: Ve solo sus propios datos

---

## 📊 Dashboard: StepGuard General v2

### Paneles Incluidos

| Panel | Descripción |
|-------|-------------|
| **Total Caídas** | Contador últimos 7 días |
| **Usuarios Activos** | Total usuarios en sistema |
| **Dispositivos Activos** | Dispositivos conectados |
| **Notificaciones** | Alertas enviadas (7 días) |
| **Tendencia** | Gráfico temporal de caídas |
| **Últimas Caídas** | Tabla con 50 eventos recientes |
| **Top 10 Usuarios** | Usuarios con más caídas |
| **Estado Dispositivos** | MAC, batería, última conexión |

---

## 🔧 Comandos Útiles

```powershell
# Ver logs de Grafana
docker logs stepguard-grafana --tail 50

# Reiniciar Grafana
docker compose restart grafana

# Reiniciar todo el stack
docker compose down && docker compose up -d

# Verificar estado
docker ps | Select-String "grafana"
```

---

## ⚙️ Configuración

### Variables de Entorno (`.env`)
```env
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin123
```

### Datasource
- **Nombre**: Neon Postgres
- **UID**: `neon_postgres`
- **Auto-configurado** desde: `provisioning/datasources/neon.yml`

### Dashboard
- **Archivo**: `provisioning/dashboards/stepguard-general-v2.json`
- **UID**: `stepguard-general-v2`
- **Auto-cargado** al iniciar Grafana

---

## 🔐 Filtrado por Rol

El dashboard usa 3 variables que el frontend configura automáticamente:

| Variable | Admin | Cuidador | Usuario |
|----------|-------|----------|---------|
| `varScope` | `all` | (vacío) | (vacío) |
| `varUserId` | `0` | `0` | `{user.id}` |
| `varCaregiverId` | `0` | `{user.id}` | `0` |

Las queries SQL aplican filtros automáticamente según estos valores.

---

## 📂 Estructura

```
monitoring/
├── README.md (este archivo)
└── grafana/
    └── provisioning/
        ├── datasources/
        │   └── neon.yml (conexión Postgres)
        └── dashboards/
            ├── dashboard.yml (config auto-load)
            └── stepguard-general-v2.json (dashboard)
```

---

## 🐛 Troubleshooting

**Iframe bloqueado**: Verifica `GF_SECURITY_ALLOW_EMBEDDING=true` en docker-compose.yml

**Datasource no encontrado**: Verifica que `uid: neon_postgres` está en neon.yml

**No hay datos**: Verifica las variables de `.env` (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)

**WebSocket warnings**: Son normales, Grafana Live intenta conectar para actualizaciones en tiempo real (opcional)
