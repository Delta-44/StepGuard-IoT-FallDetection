# Tests del Backend - Guía Completa

## 📋 Descripción General

Los tests unitarios del backend cubren los controladores principales del sistema StepGuard IoT Fall Detection:
- **Autenticación**: Recuperación y reseteo de contraseña (38 tests)
- **Registro**: Creación de usuarios y cuidadores (28 tests)
- **Gestión de Usuarios**: Obtención de información de usuarios y dispositivos (28 tests)
- **Chat**: Mensajería y gestión de historial (14 tests)
- **Eventos**: Resolución de eventos de caída (15 tests)

Todos los tests usan **Jest** con mocking de modelos y servicios, lo que permite pruebas rápidas sin requerir una base de datos real.

## 📁 Estructura de Archivos

```
backend/test/
├── README.md                          # Este archivo
├── authController.spec.ts             # Tests de autenticación (38 tests)
├── registerController.spec.ts         # Tests de registro (28 tests)
├── userController.spec.ts             # Tests de gestión de usuarios (28 tests)
├── chatController.spec.ts             # Tests de chat (14 tests)
├── eventsController.spec.ts           # Tests de eventos (15 tests)
├── utils/
│   └── mockRequestResponse.ts         # Utilidades y builders para mocks
└── mocks/
    └── database.ts                    # Mock de configuración de BD
```

**Total de Tests**: 123 tests unitarios, 100% passing ✅

## 📦 Instalar Dependencias

```powershell
cd backend
npm install
```

Verifica que estas dependencias estén presentes en `package.json`:
```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "typescript": "^5.0.0"
  }
}
```

## ▶️ Ejecutar Tests

### Ejecutar todos los tests
```powershell
npm test
```

### Ejecutar tests con cobertura
```powershell
npm test -- --coverage
```

### Ejecutar un archivo específico
```powershell
npx jest test/authController.spec.ts
npx jest test/registerController.spec.ts
npx jest test/userController.spec.ts
```

### Ejecutar tests en modo watch (reejecutar al cambiar)
```powershell
npm test -- --watch
```

### Ejecutar un test específico por nombre
```powershell
npx jest -t "debe responder 400 si falta email"
```

## 📊 Cobertura de Tests

### authController.spec.ts (38 tests)

**forgotPassword** (14 tests):
- ✅ Validación: email requerido (retorna 400)
- ✅ Manejo de emails vacíos y null
- ✅ Seguridad: email no existe devuelve 200 (previene enumeración)
- ✅ Búsqueda en usuarios y cuidadores
- ✅ Generación de JWT con expiration
- ✅ Envío de emails con URL de reset
- ✅ Errores de BD y servicio de email
- ✅ Soporte para dominios y uppercase emails

**resetPassword** (24 tests):
- ✅ Validación: token y password requeridos (retorna 400)
- ✅ Rechazo de tokens inválidos o expirados
- ✅ Verificación de propósito del token ('reset-password')
- ✅ Actualización de contraseña para usuario y cuidador
- ✅ Manejo cuando usuario no existe
- ✅ Validación de diferentes fortalezas de password
- ✅ Emails con mayúsculas
- ✅ Errores de BD y hashing

### registerController.spec.ts (28 tests)

**registerUsuario** (14 tests):
- ✅ Validación de campos requeridos (email, password, nombre)
- ✅ Rechazo de duplicados
- ✅ Creación exitosa con JWT generado
- ✅ Mapeo de dispositivos
- ✅ Búsqueda correcta en modelos de usuario
- ✅ Manejo de errores de BD
- ✅ Soporte para dominios de email variados

**registerCuidador** (14 tests):
- ✅ Validación de campos requeridos
- ✅ Creación exitosa de cuidador con JWT
- ✅ Soporte para flags admin
- ✅ Rechazo de duplicados
- ✅ Manejo de errores de BD
- ✅ Diferenciación entre usuario y cuidador

### userController.spec.ts (28 tests)

**getUsers** (9 tests):
- ✅ Combinación de usuarios y cuidadores en lista
- ✅ Mapeo correcto de roles (admin/caregiver)
- ✅ Inclusión de fullName para cuidadores
- ✅ Exclusión de password_hash
- ✅ Manejo de datasets grandes (50+ usuarios)
- ✅ Errores de BD

**getUserById** (10 tests):
- ✅ Retorno de usuario con dispositivo mapeado
- ✅ Retorno de 404 si usuario no existe
- ✅ Inclusión de información de dispositivo
- ✅ Exclusión de password_hash
- ✅ Manejo de dispositivo null
- ✅ Diferenciación usuario/cuidador

**getUsers adicionales** (9 tests):
- ✅ fullName para cuidadores
- ✅ Status activo para todos los cuidadores
- ✅ Orden correcto (usuarios primero, luego cuidadores)
- ✅ Manejo cuando solo hay usuarios
- ✅ Manejo cuando solo hay cuidadores

### chatController.spec.ts (14 tests)

**sendMessage** (10 tests):
- ✅ Validación de mensaje (requerido, no vacío)
- ✅ Integración con AIService
- ✅ Paso de contexto de usuario
- ✅ Manejo de errores del AI
- ✅ Soporte para mensajes largos
- ✅ Caracteres especiales y múltiples idiomas

**clearHistory** (4 tests):
- ✅ Validación de autenticación
- ✅ Verificación de user context
- ✅ Llamada correcta a ChatHistoryService
- ✅ Manejo de errores

### eventsController.spec.ts (15 tests)

**resolveEvent** (15 tests):
- ✅ Validación de ID de evento
- ✅ Verificación de autorización
- ✅ Resolución con estado 'atendida'
- ✅ Resolución con estado 'falsa_alarma'
- ✅ Inclusión de información del usuario
- ✅ Manejo de notas y severidad
- ✅ Eventos no encontrados (404)
- ✅ Errores de BD
- ✅ Múltiples eventos

## 🛠️ Utilidades y Builders

### mockRequest(data)
Crea un objeto Request mockeado con propiedades configurables:
```typescript
const req = mockRequest({
  body: { email: 'test@test.com', password: 'Pass123!' },
  params: { id: '1' },
  query: { page: '1' },
  headers: { authorization: 'Bearer token' },
  user: { id: 1, type: 'usuario' },
  method: 'POST'
});
```

### mockResponse()
Crea un objeto Response mockeado con métodos espiados:
```typescript
const res = mockResponse();
// Propiedades: status(), json(), send(), redirect(), cookie(), clearCookie(), locals
```

### createMockUser(overrides)
Constructor de datos de usuario para tests:
```typescript
const user = createMockUser({ 
  id: 5, 
  email: 'custom@test.com',
  edad: 40
});
```

### createMockCuidador(overrides)
Constructor de datos de cuidador para tests:
```typescript
const caregiver = createMockCuidador({ 
  id: 10,
  is_admin: true 
});
```

### createMockDispositivo(overrides)
Constructor de datos de dispositivo para tests:
```typescript
const device = createMockDispositivo({ 
  device_id: 'ESP32-ABC',
  estado: 'activo' 
});
```

## 📝 Ejemplos de Uso

### Ejemplo 1: Test Básico
```typescript
test('debe responder 400 si falta email', async () => {
  const req = mockRequest({ body: {} });
  const res = mockResponse();

  await forgotPassword(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});
```

### Ejemplo 2: Test con Mock de BD
```typescript
test('debe crear usuario cuando no existe', async () => {
  mockedUsuario.findByEmail.mockResolvedValue(null);
  const newUser = createMockUser({ email: 'new@test.com' });
  mockedUsuario.create.mockResolvedValue(newUser as any);

  const req = mockRequest({ body: { email: 'new@test.com', password: 'Pass123!', name: 'New' } });
  const res = mockResponse();

  await registerUsuario(req, res);

  expect(mockedUsuario.create).toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(201);
});
```

### Ejemplo 3: Test con Manejo de Errores
```typescript
test('debe retornar 500 si error en BD', async () => {
  mockedUsuario.findAll.mockRejectedValue(new Error('Database error'));

  const req = mockRequest();
  const res = mockResponse();

  await getUsers(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
});
```

## ✨ Características de los Tests Mejorados

✅ **Cobertura Completa**: Casos exitosos, de error y edge cases
✅ **Validación Robusta**: Tests para entrada inválida, vacía y malformada
✅ **Seguridad**: Tests de rate limiting, validación de tokens, prevención de enumeración
✅ **Manejo de Errores**: Todos los escenarios de error de BD están cubiertos
✅ **Aislamiento**: Cada test es independiente sin estado compartido
✅ **Claridad**: Nombres descriptivos y comentarios útiles
✅ **Velocidad**: No requieren BD real, se ejecutan en segundos
✅ **Builders**: Utilidades reutilizables para datos de prueba

## 🔍 Mejores Prácticas

1. **Siempre limpiar mocks**: Usar `jest.clearAllMocks()` en `beforeEach`
2. **Usar builders**: Aprovechar `createMockUser()`, `createMockCuidador()`
3. **Nombres descriptivos**: Tests deben explicar qué validan
4. **Una expectativa principal**: Cada test debe verificar un comportamiento específico
5. **Manejar async/await**: Todos los tests de controladores son async
6. **Verificar status y body**: Comprobar tanto el código HTTP como la respuesta

## 🐛 Solución de Problemas

### Tests no se encuentran
```powershell
# Verifica que la carpeta test existe
dir test

# Verifica que jest.config.cjs existe en backend/
dir jest.config.cjs
```

### Error "Cannot find module"
```powershell
# Reinstala dependencias
npm install

# Limpia caché de jest
npx jest --clearCache
```

### Tests fallan intermitentemente
- Verifica que `jest.clearAllMocks()` se llama en `beforeEach`
- Asegúrate de no usar valores globales compartidos entre tests

### Cobertura muy baja
```powershell
# Genera reporte de cobertura detallado
npm test -- --coverage --coverageReporters=text-summary
```

## 📚 Recursos Adicionales

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript Jest Setup](https://jestjs.io/docs/getting-started#using-typescript)
- [Testing Best Practices](https://jestjs.io/docs/expect)

## 🎯 Estado de Completion

- ✅ Tests de autenticación (authController) - 38 tests
- ✅ Tests de registro (registerController) - 28 tests
- ✅ Tests de gestión de usuarios (userController) - 28 tests
- ✅ Tests de chat (chatController) - 14 tests
- ✅ Tests de eventos de caída (eventsController) - 15 tests
- ⏳ Tests de integración con BD real (para ambiente staging)
- ⏳ Tests de endpoints de ESP32 (esp32Controller)
- ⏳ Tests de middleware de autenticación
- ⏳ Tests end-to-end con Supertest

## 📞 Soporte

Si encuentras problemas con los tests, verifica:
1. Versión de Node.js >= 16
2. Todas las dependencias instaladas: `npm install`
3. Archivo jest.config.cjs presente en `backend/`
4. Variables de entorno en `.env.example` si es necesario

##  Estad�sticas Finales

\\\Test Suites: 5 passed, 5 total Tests:       123 passed, 123 total Pass Rate:   100%Execution Time: ~3-4 segundos\\\`n
**Desglose por Suite:**- authController.spec.ts: 38/38 tests - registerController.spec.ts: 28/28 tests - userController.spec.ts: 28/28 tests - chatController.spec.ts: 14/14 tests - eventsController.spec.ts: 15/15 tests 

�ltima actualizaci�n: Febrero 13, 2026
