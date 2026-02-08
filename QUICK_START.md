# 🚀 Guía de Inicio Rápido - StepGuard con Grafana

Esta guía te ayudará a levantar todo el sistema StepGuard incluyendo Grafana en menos de 5 minutos.

## 📋 Pre-requisitos

Asegúrate de tener instalado:
- ✅ [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- ✅ [Node.js](https://nodejs.org/) (v18 o superior)
- ✅ [Git](https://git-scm.com/)

## 🎯 Paso 1: Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd Proyecto-Proyecto
```

## 🗄️ Paso 2: Levantar Servicios de Base de Datos

Desde el directorio backend, inicia PostgreSQL, Redis y Grafana:

```bash
cd backend
docker-compose up -d
```

Verifica que los contenedores estén corriendo:

```bash
docker-compose ps
```

Deberías ver:
```
NAME                       STATUS
stepguard-postgres         Up
stepguard-redis            Up
stepguard-grafana          Up
stepguard-pgadmin          Up (opcional)
stepguard-redis-commander  Up (opcional)
```

## ⚙️ Paso 3: Configurar Variables de Entorno

Copia el archivo de ejemplo y configúralo:

```bash
# Desde el directorio backend/
cp .env.example .env
```

Abre `.env` y verifica/modifica según necesites. Las variables más importantes son:

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stepguard
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=tu_clave_secreta_super_segura_aqui

# Grafana (opcional, tiene valores por defecto)
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin123
```

## 💾 Paso 4: Inicializar Base de Datos

Desde el directorio backend:

```bash
npm install
npm run db:init
```

Esto creará todas las tablas necesarias en PostgreSQL.

**Opcional:** Insertar datos de prueba

```bash
npm run db:seed
```

## 🚀 Paso 5: Levantar Backend

```bash
npm run dev
```

El backend estará disponible en: http://localhost:3001

## 🎨 Paso 6: Levantar Frontend

En una **nueva terminal**, desde el directorio frontend:

```bash
cd ../frontend
npm install
ng serve
```

El frontend estará disponible en: http://localhost:4200

## 📊 Paso 7: Acceder a Grafana

Abre tu navegador y ve a: http://localhost:3000

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `admin123`

### Verificar que todo funciona

Ejecuta el script de verificación:

```bash
cd backend
npm run grafana:check
```

Este script verificará:
- ✅ Conectividad a Grafana
- ✅ Autenticación
- ✅ Datasource de PostgreSQL
- ✅ Dashboards cargados

## 🎯 ¡Listo! Tu sistema está funcionando

Ahora tienes acceso a:

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Frontend** | http://localhost:4200 | (según tu config) |
| **Backend API** | http://localhost:3001 | - |
| **Grafana** | http://localhost:3000 | admin / admin123 |
| **pgAdmin** | http://localhost:5050 | admin@stepguard.com / admin123 |
| **Redis Commander** | http://localhost:8081 | - |

## 📊 Explorar Dashboards de Grafana

Una vez dentro de Grafana:

1. Click en el menú lateral (☰) → **Dashboards**
2. Verás la carpeta **StepGuard** con 4 dashboards:
   - 📊 **Dashboard General** - Vista general del sistema
   - 🚨 **Análisis de Caídas** - Estadísticas de eventos
   - 🔌 **Monitoreo de Dispositivos** - Estado de ESP32
   - 📧 **Notificaciones** - Seguimiento de alertas

3. Click en cualquiera para verlo

> 💡 **Tip:** Si no ves datos, asegúrate de haber ejecutado `npm run db:seed` para insertar datos de prueba.

## 🔧 Comandos Útiles

### Detener todos los servicios

```bash
# Desde backend/
docker-compose down
```

### Ver logs

```bash
# Logs de Grafana
docker-compose logs grafana

# Logs de PostgreSQL
docker-compose logs postgres

# Logs del backend
# (en la terminal donde ejecutaste npm run dev)
```

### Reiniciar un servicio específico

```bash
docker-compose restart grafana
docker-compose restart postgres
```

### Verificar estado de servicios

```bash
docker-compose ps
npm run grafana:check
```

## ❌ Solución de Problemas Comunes

### Problema: "Error: connect ECONNREFUSED"

**Causa:** Los servicios de Docker no están corriendo.

**Solución:**
```bash
cd backend
docker-compose up -d
```

### Problema: No aparecen datos en Grafana

**Causa:** La base de datos está vacía.

**Solución:**
```bash
cd backend
npm run db:seed
```

Luego refresca los dashboards en Grafana.

### Problema: "Port 3000 already in use"

**Causa:** Otro servicio está usando el puerto 3000.

**Solución:**
1. Opción A: Detener el servicio que está en el puerto 3000
2. Opción B: Cambiar el puerto de Grafana en `docker-compose.yml`:
   ```yaml
   ports:
     - "3001:3000"  # Puerto externo:interno
   ```

### Problema: Grafana no carga dashboards

**Causa:** Los archivos de dashboard no están montados correctamente.

**Solución:**
```bash
# Resetear Grafana
docker-compose down
docker volume rm backend_grafana_data
docker-compose up -d
```

Espera 30 segundos y verifica:
```bash
npm run grafana:check
```

## 📚 Próximos Pasos

1. **Configurar dispositivos ESP32** - Ver [device/README.md](../device/README.md)
2. **Personalizar Grafana** - Ver [GRAFANA.md](../GRAFANA.md)
3. **Explorar la API** - Ver [backend/endpoints.md](../backend/endpoints.md)
4. **Configurar alertas** - Ver sección de alertas en [GRAFANA.md](../GRAFANA.md)

## 🆘 ¿Necesitas Ayuda?

- 📖 Documentación completa de Grafana: [GRAFANA.md](../GRAFANA.md)
- 🔧 Backend README: [backend/README.md](../backend/README.md)
- 💬 Issues del proyecto: (enlace a GitHub Issues)

---

**¡Disfruta explorando StepGuard con Grafana! 📊**
