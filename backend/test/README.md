# Tests del Backend - StepGuard IoT

Documentación de los tests unitarios que cubren todas las funcionalidades del backend de StepGuard.

## Estructura

Los tests se encuentran en `backend/test/` y están organizados por componentes:

### Controladores (7 archivos, 60 tests)

- **authController.spec.ts** (8 tests): Recuperación y reseteo de contraseña
- **registerController.spec.ts** (5 tests): Registro de usuarios y cuidadores
- **userController.spec.ts** (3 tests): Obtención de datos de usuarios
- **loginController.spec.ts** (10 tests): Autenticación de usuarios, cuidadores y admins
- **googleAuthController.spec.ts** (10 tests): Autenticación con Google OAuth2
- **esp32Controller.spec.ts** (11 tests): Recepción y gestión de datos IoT
- **eventsController.spec.ts** (13 tests): Gestión de eventos de caída

### Servicios (4 archivos, 47 tests)

- **alertService.spec.ts** (9 tests): Sistema de alertas en tiempo real (SSE)
- **esp32Service.spec.ts** (14 tests): Procesamiento de telemetría del ESP32
- **emailService.spec.ts** (11 tests): Envío de emails de recuperación
- **discordService.spec.ts** (13 tests): Notificaciones por Discord - [Documentación detallada](./DISCORD_SERVICE_TESTING.md)

### Utilidades

- **utils/mockRequestResponse.ts**: Funciones auxiliares para crear mocks de Request/Response
- **mocks/**: Mocks específicos de módulos externos
- **jest.setup.ts**: Configuración global de Jest

## Instalación

```bash
cd backend
npm install
```

Verifica que estas dependencias estén en `devDependencies`:
- jest (>= 29.0.0)
- ts-jest (>= 29.0.0)
- @types/jest (>= 29.0.0)

## Ejecutar Tests

### Todos los tests

```bash
npm test
```

Resultado esperado: 107 tests pasando en 5-8 segundos

### Tests específicos

```bash
# Un archivo completo
npm test -- loginController.spec.ts

# Un describe block (por nombre)
npm test -- --testNamePattern="login"

# Un test individual
npm test -- --testNamePattern="debería login exitoso"

# Patrón con regex
npm test -- --testNamePattern="(email|password)"
```

### Modo watch (auto-reejecutar al guardar)

```bash
# Todos los tests en watch
npm test -- --watch

# Un archivo en watch
npm test -- loginController.spec.ts --watch

# Sin coverage (más rápido)
npm test -- --watch --no-coverage
```

### Reporte de cobertura

```bash
npm test -- --coverage
```

Cobertura esperada:
- Statements: > 95%
- Branches: > 90%
- Functions: > 95%
- Lines: > 95%

### Opciones útiles

```bash
# Detener en el primer error
npm test -- --bail

# Máximo parallelismo (workers)
npm test -- --maxWorkers=4

# Output verbose
npm test -- --verbose

# Update snapshots
npm test -- --updateSnapshot

# Clear Jest cache
npm test -- --clearCache
```

## Estructura de un Test

Cada archivo sigue el patrón AAA (Arrange-Act-Assert):

```typescript
// 1. Mocks al principio
jest.mock('../src/models/usuario');
jest.mock('../src/services/emailService');

// 2. Imports después de mocks
import { loginController } from '../src/controllers/loginController';
import { UsuarioModel } from '../src/models/usuario';

// 3. Type cast para mocks
const mockedUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;

describe('loginController', () => {
  // 4. Setup global
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 5. Tests
  test('debería login exitoso con credenciales correctas', async () => {
    // ARRANGE: Preparar datos
    (mockedUsuario.findByEmail as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'user@test.com',
      password_hash: 'hashedpwd'
    });

    // ACT: Ejecutar función
    const req = mockRequest({ body: { email: 'user@test.com', password: 'pwd' } });
    const res = mockResponse();
    await loginController(req, res);

    // ASSERT: Verificar resultado
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
```

## Utilities de Mock

### mockRequest() y mockResponse()

Ubicados en `utils/mockRequestResponse.ts`:

```typescript
// Crear request con datos
const req = mockRequest({
  body: { email: 'test@test.com', password: 'pwd' },
  params: { id: '1' },
  user: { id: 10, role: 'admin' }
});

// Crear response vacío
const res = mockResponse();

// Verificar llamadas
expect(res.status).toHaveBeenCalledWith(200);
expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
```

## Casos Críticos Siempre Probados

Para cada controlador/servicio se prueban:

- Validación de entrada vacía/nula
- Validación de tipos incorrectos
- Caso exitoso (happy path)
- Casos alternativos de negocio
- Validación de autorización/autenticación
- Error 400 (bad request)
- Error 401 (unauthorized)
- Error 403 (forbidden)
- Error 404 (not found)
- Error 500 (server error)

## Cobertura por Tipo

### Controllers

```
Controller          Tests    Coverage    Status
─────────────────────────────────────────────────
authController        8        100%       PASS
registerController    5        100%       PASS
userController        3        95%        PASS
loginController      10        100%       PASS
googleAuthController 10        100%       PASS
esp32Controller      11        100%       PASS
eventsController     13        100%       PASS
─────────────────────────────────────────────────
TOTAL               60        99%        PASS
```

### Services

```
Service              Tests    Coverage    Status
─────────────────────────────────────────────────
alertService          9        100%       PASS
esp32Service         14        100%       PASS
emailService         11        100%       PASS
discordService       13        100%       PASS
─────────────────────────────────────────────────
TOTAL               47        100%       PASS
```

## Configuración Jest

Ubicada en `jest.config.cjs`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/test/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
};
```

## Troubleshooting

### Error: "Cannot find module"

```bash
rm -rf node_modules package-lock.json
npm install
npm test
```

### Tests muy lentos

Opciones:
```bash
# Ejecutar solo un archivo
npm test -- loginController.spec.ts

# Usar menos workers
npm test -- --maxWorkers=2

# Aumentar timeout en código
jest.setTimeout(10000);
```

### Mocks no funcionan

Asegúrate de:
1. Los mocks están ANTES de los imports
2. Ir un `jest.clearAllMocks()` en cada `beforeEach`
3. Usar TypeScript cast: `const mocked = Service as jest.Mocked<typeof Service>`

### Port ya en uso

Si un test usa BD local:
```bash
# Encontrar proceso en puerto 5432
lsof -i :5432

# Matar el proceso
kill -9 <PID>
```

## Próximos Pasos

### Tests E2E (Cypress/Playwright)
```bash
npm run e2e
```

### Tests de Integración
```bash
npm run test:integration
```

### Tests de Performance
```bash
npm run test:performance
```

## Estadísticas Generales

| Métrica | Valor |
|---------|-------|
| Total de Tests | 107 |
| Archivos de Test | 11 |
| Métodos Probados | 23 |
| Cobertura de Código | > 95% |
| Tiempo de Ejecución | 5-8 segundos |
| Estado | Todos pasando |

## Referencias

Para documentación completa, ver: [TEST_DOCUMENTATION.md](./TEST_DOCUMENTATION.md)

Para referencia rápida, ver: [REFERENCES.md](./REFERENCES.md)

---

**Última actualización**: 16 de febrero de 2026  
**Versión**: 2.0  
**Framework**: Jest 29  
**TypeScript**: 5.x
describe('authController - forgotPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  test('debe responder 400 si falta email', async () => {
    const req: any = mockRequest({ body: {} });
    const res: any = mockResponse();
    await forgotPassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
```

## Notas importantes

- **No requieren DB real**: Los tests mockean los modelos y servicios.
- **Aislados y rápidos**: Cada test es independiente y se ejecuta sin estado compartido.
- **Facilitan debugging**: Si un test falla, se muestra claramente cuál fue la expectativa no cumplida.
