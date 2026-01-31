# 🔌 GUÍA DE CONEXIÓN A BASES DE DATOS
**StepGuard - PostgreSQL (Neon) y Redis**

## 📌 Problema Común

El 99% de los problemas de conexión se deben a **NO tener el archivo `.env` configurado**. Este proyecto soporta:
- 🏠 **Local**: Docker en tu PC
- ☁️ **Remoto**: Neon + Redis Cloud (trabajo en equipo)

## 🚀 Configuración Rápida

### 1️⃣ Crear archivo `.env`
```bash
cd backend
Copy-Item .env.example .env  # Windows
cp .env.example .env         # macOS/Linux
```

### 2️⃣ Configurar Credenciales

Edita `backend/.env` con tus datos:

**PostgreSQL (Neon)**: Obtén credenciales en [neon.tech](https://neon.tech) → Dashboard → Connection Details
```env
DB_HOST=ep-xxxxx-xxxxx.us-east-2.aws.neon.tech
DB_PASSWORD=tu_password_de_neon
```

**Redis**: Usa [Redis Cloud](https://redis.com/try-free/) o [Upstash](https://upstash.com)
```env
REDIS_HOST=redis-12345.c293.eu-central-1-1.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=tu_password_redis
```

⚠️ **Importante**: NO uses comillas en los valores. SSL/TLS se detecta automáticamente.

### 3️⃣ Verificar y Probar
```bash
npm install
npm run db:diagnose  # Verifica configuración
npm run db:test      # Prueba conexión
npm run db:init      # Solo primera vez: crea tablas
npm run db:seed      # Opcional: datos de prueba
```

## 🔧 Ejemplos de Configuración

### 🏠 Local (Docker)
```env
DB_HOST=localhost
REDIS_HOST=localhost
```
Requiere: `docker-compose up -d`

### ☁️ Remoto (Neon + Redis Cloud)
```env
DB_HOST=ep-xxxxx.us-east-2.aws.neon.tech
DB_PASSWORD=npg_xxxxx
REDIS_HOST=redis-10155.c293.eu-central-1-1.ec2.cloud.redislabs.com
REDIS_PORT=10155
REDIS_PASSWORD=xxxxx
```
✅ No necesita Docker, funciona desde cualquier PC

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### ❌ Error: "connect ECONNREFUSED"

**Causa:** No puede conectar al servidor

**Solución:**
1. Verifica que tu archivo `.env` existe en la carpeta `backend/`
2. Verifica que el `DB_HOST` y `REDIS_HOST` son correctos
3. Si usas bases de datos locales, asegúrate de que Docker está corriendo:
   ```bash
   docker-compose up -d
   ```

---

### ❌ Error: "password authentication failed"

**Causa:** Usuario o contraseña incorrectos

**Solución:**
1. Verifica que `DB_USER` y `DB_PASSWORD` son correctos
2. Copia las credenciales directamente desde Neon
3. **NO pongas comillas** en el archivo `.env`:
   ```env
   # ❌ INCORRECTO
   DB_PASSWORD="mi_password"
   
   # ✅ CORRECTO
   DB_PASSWORD=mi_password
   ```

---

### ❌ Error: "self signed certificate" (SSL)

**Causa:** Problema con certificados SSL de Neon

**Solución:**
El código ya maneja esto automáticamente. Si tienes problemas:

1. Verifica que tu `DB_HOST` contiene `.neon.tech` o `.supabase.co`
2. Verifica que no estás usando `NODE_TLS_REJECT_UNAUTHORIZED=0` en otras partes

---
## 🐛 Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `connect ECONNREFUSED` | No encuentra servidor | Verifica `.env` existe y `DB_HOST`/`REDIS_HOST` correctos. Si es local: `docker-compose up -d` |
| `password authentication failed` | Credenciales incorrectas | Verifica `DB_PASSWORD`. NO uses comillas: `DB_PASSWORD=value` ✅ no `"value"` ❌ |
| `SSL routines:packet length` | Error TLS Redis | Redis Cloud usa puertos personalizados sin TLS. Solo Upstash puerto 6380 usa TLS |
| `cannot find module` | Faltan dependencias | `npm install` |
| `WRONGPASS` | Password Redis incorrecta | Copia exacta desde proveedor. Local sin password: `REDIS_PASSWORD=` |
---

## 💬 ¿NECESITAS AYUDA?

Si sigues teniendo problemas después de seguir esta guía:

1. Ejecuta `npm run db:diagnose` y revisa los errores/advertencias
2. Ejecuta `npm run db:test` y copia el error completo (sin incluir contraseñas)
3. Verifica que tu archivo `.env` tenga las credenciales correctas
4. Comparte el error con el equipo
5. Contacta al líder del proyecto para verificar las credenciales

---

## 🎯 COMANDOS ÚTILES

```bash
# 1. Diagnosticar problemas de configuración
npm run db:diagnose

# 2. Probar conexión a las bases de datos
npm run db:test

# 3. Inicializar tablas (primera vez)
npm run db:init

# 4. Insertar datos de prueba
npm run db:seed
npm run redis:seed

# 5. Ver datos de Redis
npm run redis:view

# 6. Iniciar servidor
npm run dev

# 7. Ver logs de Docker (si usas local)
docker-compose logs -f
```

---

**Última actualización:** 31 de enero de 2026  
**Versión:** 1.0  
**Mantenido por:** Equipo StepGuard
## 📝 Checklist de Verificación

```
□ Archivo .env creado en backend/
□ DB_HOST y DB_PASSWORD configurados (sin comillas)
□ REDIS_HOST y REDIS_PASSWORD configurados
□ npm install ejecutado
□ npm run db:diagnose sin errores
□ npm run db:test exitoso
```

## 🔐 Seguridad

⚠️ **NUNCA subas `.env` a Git**. Comparte credenciales por gestor de contraseñas o mensaje privado.

## 💬 Ayuda

1. `npm run db:diagnose` - Ver configuración
2. `npm run db:test` - Probar conexión  
3. Compartir errores (sin passwords) con el equipo## 🎯 Comandos

```bash
npm run db:diagnose  # Verificar configuración
npm run db:test      # Probar conexión
npm run db:init      # Crear tablas (primera vez)
npm run db:seed      # Datos de prueba
npm run dev          # Iniciar servidor
```

---
*Última actualización: 31 enero 2026 • Equipo StepGuard*