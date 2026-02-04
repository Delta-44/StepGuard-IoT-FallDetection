# 🚀 Guía Rápida de Uso - Sistema de IA StepGuard

## ✅ Estado Actual

**El sistema de IA está 100% implementado y listo para usar.**

## 📁 Archivos Principales

- **Documentación completa**: `AI-SYSTEM-SUMMARY.md` (raíz del proyecto)
- **Documentación técnica**: `backend/src/ai/README.md`
- **Código fuente**: `backend/src/ai/` (25 archivos TypeScript)

## 🎯 Cómo Iniciar el Servidor

### Opción 1: Usando npm (Recomendado)
```powershell
cd C:\Users\dalon\Proyecto-Proyecto\backend
npm run dev
```

### Opción 2: Directamente con npx
```powershell
cd C:\Users\dalon\Proyecto-Proyecto\backend
npx nodemon --exec npx ts-node src/server.ts
```

### Opción 3: Sin hot-reload
```powershell
cd C:\Users\dalon\Proyecto-Proyecto\backend
npx ts-node src/server.ts
```

## 🔍 Verificar que el Servidor Esté Corriendo

Deberías ver estos mensajes en consola:
```
Initializing AI Engine...
[AI Engine] [INFO] 🤖 Initializing AI Engine...
[AI Engine] [SUCCESS] ✅ AI Engine initialized successfully
✓ AI Engine initialized successfully
Server is running on http://localhost:3000
AI endpoints available at /api/ai/*
✅ Conectado a Redis
```

## 🧪 Probar los Endpoints

### Desde PowerShell

```powershell
# Health Check
Invoke-RestMethod -Uri "http://localhost:3000/api/ai/health"

# Status del Sistema
Invoke-RestMethod -Uri "http://localhost:3000/api/ai/status"

# Endpoint raíz
Invoke-RestMethod -Uri "http://localhost:3000/"
```

### Desde navegador
Abre tu navegador y visita:
- http://localhost:3000/
- http://localhost:3000/api/ai/health
- http://localhost:3000/api/ai/status

### Usando Postman o Thunder Client (VS Code)
1. GET `http://localhost:3000/api/ai/health`
2. GET `http://localhost:3000/api/ai/status`
3. GET `http://localhost:3000/api/ai/analyze/1`
4. GET `http://localhost:3000/api/ai/risk/ESP32_001`
5. POST `http://localhost:3000/api/ai/predict-fall`
   ```json
   {
     "deviceId": "ESP32_001",
     "timeWindow": 24
   }
   ```

## 📊 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/ai/health` | Health check del sistema |
| GET | `/api/ai/status` | Estado del motor de IA |
| GET | `/api/ai/analyze/:userId` | Análisis completo de usuario |
| GET | `/api/ai/risk/:deviceId` | Análisis de riesgo de dispositivo |
| GET | `/api/ai/anomalies/:deviceId?timeWindow=60` | Detectar anomalías |
| GET | `/api/ai/insights/:userId` | Insights y recomendaciones |
| POST | `/api/ai/predict-fall` | Predicción de caídas |
| POST | `/api/ai/batch-analyze` | Análisis por lotes |
| POST | `/api/ai/initialize` | Reinicializar sistema |

## ⚠️ Notas Importantes

### 1. Datos de Prueba
Algunos endpoints retornarán datos vacíos hasta que haya:
- Datos de sensores en Redis (desde ESP32)
- Eventos de caída en PostgreSQL

### 2. Nodemon y Hot-Reload
Si estás usando `npm run dev`, nodemon reiniciará el servidor automáticamente cuando detecte cambios en los archivos. Esto es normal.

### 3. Puerto en Uso
Si el puerto 3000 está ocupado, puedes cambiarlo en el archivo `.env`:
```env
PORT=3001
```

## 🐛 Solución de Problemas

### El servidor no inicia
```powershell
# Verificar que no hay procesos de Node.js corriendo
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Si hay procesos, detenerlos
taskkill /F /IM node.exe

# Reinstalar dependencias
cd C:\Users\dalon\Proyecto-Proyecto\backend
npm install
```

### Error de compilación TypeScript
```powershell
cd C:\Users\dalon\Proyecto-Proyecto\backend
npx tsc --noEmit
```

### Error de conexión a Redis o PostgreSQL
Verifica las variables de entorno en `.env`:
```env
REDIS_URL=...
DATABASE_URL=...
```

## 📚 Documentación Adicional

### Para entender el sistema
Lee: `AI-SYSTEM-SUMMARY.md`

### Para detalles técnicos
Lee: `backend/src/ai/README.md`

### Para ejemplos de código
Revisa: `backend/src/test-ai-system.ts`

## 🎓 Siguiente Pasos Sugeridos

1. **Probar con datos reales**
   - Enviar datos desde ESP32 a Redis
   - Registrar eventos en PostgreSQL
   
2. **Integrar con Frontend**
   - Consumir endpoints desde Angular
   - Crear dashboard con gráficos
   
3. **Desplegar en producción**
   - Configurar Render.com o Vercel
   - Configurar variables de entorno
   
4. **Documentar para la presentación**
   - Capturas de pantalla
   - Diagramas de arquitectura
   - Casos de uso

## ✅ Checklist de Verificación

- [x] Sistema de IA implementado (25 archivos)
- [x] 9 endpoints REST funcionales
- [x] Servidor integrado y funcionando
- [x] Documentación completa
- [x] Sin dependencias nativas (deployable en cualquier servidor)
- [x] Optimizado para 512MB RAM
- [ ] Probado con datos reales
- [ ] Integrado con frontend
- [ ] Desplegado en producción

## 🎉 ¡Todo Listo!

El sistema de IA está completamente implementado y documentado. Puedes comenzar a:
- Enviar datos desde tus dispositivos ESP32
- Consumir los endpoints desde tu aplicación Angular
- Preparar la presentación de tu proyecto

**¡Éxito con tu proyecto! 🚀**
