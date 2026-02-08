# Grafana - StepGuard

Este directorio contiene la configuración y dashboards de Grafana para el proyecto StepGuard.

## 📁 Estructura

```
grafana/
├── provisioning/
│   ├── datasources/
│   │   └── datasource.yml          # Conexión automática a PostgreSQL
│   └── dashboards/
│       └── dashboard.yml            # Configuración de carga de dashboards
└── dashboards/
    ├── 01-general-overview.json     # Dashboard principal con KPIs
    ├── 02-fall-analysis.json        # Análisis detallado de caídas
    ├── 03-devices-monitoring.json   # Monitoreo de dispositivos ESP32
    └── 04-notifications.json        # Seguimiento de notificaciones
```

## 🚀 Inicio Rápido

1. **Levantar servicios:**
   ```bash
   docker-compose up -d
   ```

2. **Acceder a Grafana:**
   - URL: http://localhost:3000
   - Usuario: `admin`
   - Contraseña: `admin123`

3. **Explorar dashboards:**
   - Los 4 dashboards se cargan automáticamente
   - Están en la carpeta "StepGuard"

## 📊 Dashboards Disponibles

| Dashboard | Descripción | Uso Principal |
|-----------|-------------|---------------|
| **General Overview** | KPIs y vista general del sistema | Monitoreo diario |
| **Análisis de Caídas** | Estadísticas y patrones de caídas | Análisis de riesgo |
| **Monitoreo de Dispositivos** | Estado de ESP32 y conectividad | Mantenimiento |
| **Notificaciones** | Seguimiento de alertas enviadas | Auditoría |

## 🔧 Configuración

### Datasource PostgreSQL

El archivo `provisioning/datasources/datasource.yml` configura automáticamente la conexión a PostgreSQL:

- **Host:** `postgres:5432` (nombre del contenedor)
- **Database:** `stepguard`
- **User:** `postgres`
- **Password:** `postgres`

### Modificar Credenciales

Edita `docker-compose.yml`:

```yaml
environment:
  - GF_SECURITY_ADMIN_USER=tu_usuario
  - GF_SECURITY_ADMIN_PASSWORD=tu_contraseña
```

## 📖 Documentación Completa

Ver [GRAFANA.md](../GRAFANA.md) en la raíz del proyecto para:
- Guía detallada de cada dashboard
- Casos de uso específicos
- Personalización y alertas
- Troubleshooting
- Mejores prácticas

## 🔄 Actualizar Dashboards

Si modificas un dashboard:

1. Exporta el JSON desde Grafana (Dashboard settings → JSON Model)
2. Reemplaza el archivo correspondiente en `dashboards/`
3. Reinicia Grafana:
   ```bash
   docker-compose restart grafana
   ```

## ⚠️ Notas Importantes

- Los dashboards provisionados son de solo lectura
- Para hacer cambios permanentes, actualiza los archivos JSON
- El datasource se configura automáticamente al iniciar
- Los datos se persisten en el volumen `grafana_data`

## 🛠️ Troubleshooting

**No aparecen datos:**
```bash
# Verificar conexión a PostgreSQL
docker exec -it stepguard-grafana nc -zv postgres 5432

# Ver logs
docker-compose logs grafana
```

**Resetear Grafana:**
```bash
docker-compose down
docker volume rm backend_grafana_data
docker-compose up -d
```

## 📞 Soporte

- Documentación completa: [GRAFANA.md](../GRAFANA.md)
- Logs: `docker-compose logs grafana`
- Oficial: https://grafana.com/docs/
