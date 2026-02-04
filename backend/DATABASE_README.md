# ================================================
# GUÍA DE CONFIGURACIÓN DE BASE DE DATOS
# StepGuard - Sistema de Detección de Caídas
# ================================================

## 📋 Descripción

Este proyecto utiliza dos bases de datos:

1. **PostgreSQL** - Base de datos relacional para usuarios, cuidadores, dispositivos y administradores
2. **Redis** - Cache en memoria para datos en tiempo real de dispositivos ESP32

## 🚀 Inicio Rápido

### 1. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus configuraciones
```

### 2. Levantar las bases de datos con Docker

```bash
# Iniciar PostgreSQL y Redis
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### 3. Verificar conexión

Los servicios estarán disponibles en:

- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **pgAdmin** (interfaz web): `http://localhost:5050`
  - Email: `admin@stepguard.com`
  - Password: `admin123`
- **Redis Commander** (interfaz web): `http://localhost:8081`

## 📊 Esquema de Base de Datos PostgreSQL

### Tablas Principales

1. **admins** - Administradores del sistema
   - Gestión completa de usuarios, cuidadores y dispositivos

2. **cuidadores** - Cuidadores que monitorizan usuarios
   - Pueden visualizar alertas y estado de múltiples usuarios
   - Relación muchos-a-muchos con usuarios

3. **usuarios** - Personas mayores (usuarios finales)
   - Asociados a un dispositivo ESP32
   - Pueden tener múltiples cuidadores asignados

4. **dispositivos** - Dispositivos ESP32
   - Almacena configuración y estado
   - Relación uno-a-uno con usuarios

5. **usuario_cuidador** - Tabla de relación
   - Conecta cuidadores con usuarios (muchos-a-muchos)

### Diagrama de Relaciones

```
admins (gestiona todo)
    
cuidadores ←→ usuario_cuidador ←→ usuarios → dispositivos
(muchos)           (tabla pivot)        (muchos)   (uno-a-uno)
```

## 🔴 Redis - Datos de Dispositivos ESP32

Redis almacena datos en tiempo real enviados por los dispositivos:

### Estructura de Datos

```typescript
// Ejemplo de datos enviados por ESP32
{
  "deviceId": "ESP32-001",
  "accX": -1.23,
  "accY": 0.45,
  "accZ": 9.81,
  "fallDetected": true,
  "timestamp": 1706543210000
}
```

### Claves Redis

- `device:{deviceId}` - Último estado del dispositivo
- `history:{deviceId}` - Historial de lecturas (últimas 100)
- `status:{deviceId}` - Estado de conexión (online/offline)
- `alert:{deviceId}` - Última alerta de caída
- `fall_alerts` - Sorted set con todas las alertas

## 🔧 Comandos Útiles

### PostgreSQL

```bash
# Conectar a PostgreSQL desde el contenedor
docker exec -it stepguard-postgres psql -U postgres -d stepguard

# Ejecutar el script de inicialización manualmente
docker exec -i stepguard-postgres psql -U postgres -d stepguard < src/database/init.sql

# Backup de la base de datos
docker exec stepguard-postgres pg_dump -U postgres stepguard > backup.sql

# Restaurar backup
docker exec -i stepguard-postgres psql -U postgres stepguard < backup.sql
```

### Redis

```bash
# Conectar a Redis CLI
docker exec -it stepguard-redis redis-cli -a redis_password

# Ver todas las claves
docker exec -it stepguard-redis redis-cli -a redis_password KEYS "*"

# Ver datos de un dispositivo
docker exec -it stepguard-redis redis-cli -a redis_password GET "device:ESP32-001"

# Ver historial
docker exec -it stepguard-redis redis-cli -a redis_password LRANGE "history:ESP32-001" 0 9

# Limpiar todos los datos
docker exec -it stepguard-redis redis-cli -a redis_password FLUSHALL
```

## 📦 Modelos Disponibles

Los modelos están en `src/models/`:

- `admin.ts` - AdminModel
- `cuidador.ts` - CuidadorModel
- `usuario.ts` - UsuarioModel
- `dispositivo.ts` - DispositivoModel

### Ejemplo de Uso

```typescript
import { UsuarioModel } from './models/usuario';
import { DispositivoModel } from './models/dispositivo';
import { CuidadorModel } from './models/cuidador';
import { ESP32Cache } from './config/redis';

// Crear usuario
const usuario = await UsuarioModel.create(
  'Juan Pérez',
  'juan@example.com',
  'password_hash',
  75,
  'Calle Mayor 123',
  '+34 600 000 000'
);

// Asignar dispositivo a usuario
await UsuarioModel.asignarDispositivo(usuario.id, 1);

// Asignar cuidador a usuario
await CuidadorModel.asignarUsuario(1, usuario.id);

// Guardar datos del ESP32 en Redis
await ESP32Cache.setDeviceData('ESP32-001', {
  deviceId: 'ESP32-001',
  accX: -1.23,
  accY: 0.45,
  accZ: 9.81,
  fallDetected: false
});

// Obtener datos del ESP32
const data = await ESP32Cache.getDeviceData('ESP32-001');
```

## 🔒 Seguridad

- **Contraseñas**: Siempre usar bcrypt para hashear contraseñas
- **JWT**: Cambiar `JWT_SECRET` en producción
- **Redis**: Configurar password fuerte en producción
- **PostgreSQL**: Cambiar credenciales por defecto en producción

## 🐛 Solución de Problemas

### Error: Puerto ya en uso

```bash
# Verificar qué proceso usa el puerto
netstat -ano | findstr :5432
netstat -ano | findstr :6379

# Detener el proceso o cambiar el puerto en docker-compose.yml
```

### Error: No se puede conectar a PostgreSQL

```bash
# Verificar que el contenedor está corriendo
docker ps

# Ver logs del contenedor
docker-compose logs postgres

# Reiniciar el servicio
docker-compose restart postgres
```

### Error: Redis connection refused

```bash
# Verificar estado de Redis
docker-compose logs redis

# Probar conexión
docker exec -it stepguard-redis redis-cli -a redis_password PING
```

## 📚 Recursos Adicionales

- [Documentación de PostgreSQL](https://www.postgresql.org/docs/)
- [Documentación de Redis](https://redis.io/docs/)
- [node-postgres (pg) Docs](https://node-postgres.com/)
- [ioredis Docs](https://github.com/redis/ioredis)

## 👥 Roles y Permisos

### Admin
- Gestión completa de usuarios
- Gestión de cuidadores
- Gestión de dispositivos
- Acceso a todas las funcionalidades

### Cuidador
- Visualizar alertas de sus usuarios asignados
- Ver estado de dispositivos de sus usuarios
- Gestionar información de sus usuarios
- No puede crear/eliminar usuarios o dispositivos

### Usuario
- Ver su propio perfil
- Ver estado de su dispositivo
- Ver su historial de alertas
- Acceso limitado solo a su información
