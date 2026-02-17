# Guía de Testing - Cómo Escribir Tests en StepGuard

Esta guía proporciona estándares y mejores prácticas para escribir tests unitarios en el proyecto StepGuard.

---

## Estructura Básica de un Test

Todos los tests deben seguir el patrón **AAA (Arrange-Act-Assert)**:

```typescript
describe('NombreDelComponente', () => {
  describe('nombreDelMetodo', () => {
    test('debería [comportamiento esperado] cuando [condición]', async () => {
      // ARRANGE: Preparar datos y mocks
      const input = { email: 'test@test.com', password: 'pwd123' };
      mockedUsuario.findByEmail.mockResolvedValue({ id: 1 });

      // ACT: Ejecutar la función
      const req = mockRequest({ body: input });
      const res = mockResponse();
      await loginController(req, res);

      // ASSERT: Verificar el resultado
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
    });
  });
});
```

---

## Paso 1: Configurar Mocks

### Mocks de Modelos

```typescript
// Colocar ANTES de cualquier import
jest.mock('../src/models/usuario');
jest.mock('../src/models/dispositivo');

// Luego importar
import { UsuarioModel } from '../src/models/usuario';
import { DispositivoModel } from '../src/models/dispositivo';

// Type casting para IntelliSense
const mockedUsuario = UsuarioModel as jest.Mocked<typeof UsuarioModel>;
const mockedDispositivo = DispositivoModel as jest.Mocked<typeof DispositivoModel>;
```

### Mocks de Servicios

```typescript
jest.mock('../src/services/emailService');

const mockEmailService = require('../src/services/emailService').default;
// O usar dynamic import en beforeEach
```

### Mocks de Módulos Externos

```typescript
// JWT Mock
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Bcrypt Mock
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Redis Mock
jest.mock('../src/config/redis', () => ({
  ESP32Cache: {
    setDeviceData: jest.fn().mockResolvedValue(true),
    getDeviceData: jest.fn(),
    addDeviceHistory: jest.fn().mockResolvedValue(true),
  }
}));
```

### beforeEach - Resetear Mocks

```typescript
describe('SomeController', () => {
  beforeEach(() => {
    // CRÍTICO: Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();

    // Opcional: Setup default return values
    (mockedJwt.sign as jest.Mock).mockReturnValue('mocktoken123');
    (mockedBcrypt.genSalt as jest.Mock).mockResolvedValue('salt123');
  });
});
```

---

## Paso 2: Crear Mock de Request/Response

Usar utilidades de [mockRequestResponse.ts](./utils/mockRequestResponse.ts):

```typescript
import { mockRequest, mockResponse } from './utils/mockRequestResponse';

// Request con data
const req = mockRequest({
  body: { email: 'user@test.com', password: 'pwd' },
  params: { id: '1' },
  query: { limit: '10' },
  user: { id: 5, role: 'admin' }
});

// Response vacío
const res = mockResponse();

// Verificar respuesta
expect(res.status).toHaveBeenCalledWith(200);
expect(res.json).toHaveBeenCalled();
```

---

## Paso 3: Escribir el Test

### Validación de Entrada (SIEMPRE incluir)

```typescript
test('debería retornar 400 si email está vacío', async () => {
  const req = mockRequest({ body: { email: '', password: 'pwd' } });
  const res = mockResponse();

  await loginController(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({ message: expect.any(String) })
  );
});
```

### Caso Exitoso (Happy Path)

```typescript
test('debería login exitoso con credenciales correctas', async () => {
  // Setup mocks
  (mockedUsuario.findByEmail as jest.Mock).mockResolvedValue({
    id: 1,
    email: 'user@test.com',
    password_hash: 'hashedpwd'
  });
  (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);

  // Ejecutar
  const req = mockRequest({ body: { email: 'user@test.com', password: 'correctpwd' } });
  const res = mockResponse();
  await loginController(req, res);

  // Verificar
  expect(res.status).not.toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      message: 'Login successful',
      token: expect.any(String),
      user: expect.objectContaining({ id: 1, email: 'user@test.com' })
    })
  );
});
```

### Casos de Error

```typescript
// Error 400 (Bad Request)
test('debería retornar 400 si usuario no existe', async () => {
  (mockedUsuario.findByEmail as jest.Mock).mockResolvedValue(null);

  const req = mockRequest({ body: { email: 'fake@test.com', password: 'pwd' } });
  const res = mockResponse();
  await loginController(req, res);

  expect(res.status).toHaveBeenCalledWith(400);
});

// Error 401 (Unauthorized)
test('debería retornar 401 si token es inválido', async () => {
  (mockedJwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });

  const req = mockRequest({ body: { token: 'badtoken' } });
  const res = mockResponse();
  await controller(req, res);

  expect(res.status).toHaveBeenCalledWith(401);
});

// Error 403 (Forbidden)
test('debería retornar 403 si usuario no es propietario', async () => {
  const req = mockRequest({ 
    params: { id: '999' },
    user: { id: 1, role: 'usuario' }
  });
  const res = mockResponse();
  await updateController(req, res);

  expect(res.status).toHaveBeenCalledWith(403);
});

// Error 404 (Not Found)
test('debería retornar 404 si recurso no existe', async () => {
  (mockedUsuario.findById as jest.Mock).mockResolvedValue(null);

  const req = mockRequest({ params: { id: '999' } });
  const res = mockResponse();
  await getController(req, res);

  expect(res.status).toHaveBeenCalledWith(404);
});

// Error 500 (Server Error)
test('debería retornar 500 si hay error en BD', async () => {
  (mockedUsuario.findByEmail as jest.Mock).mockRejectedValue(
    new Error('Database connection failed')
  );

  const req = mockRequest({ body: { email: 'test@test.com' } });
  const res = mockResponse();
  await controller(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
});
```

### Verificar Llamadas a Servicios

```typescript
test('debería llamar emailService.sendPasswordResetEmail', async () => {
  (mockedUsuario.findByEmail as jest.Mock).mockResolvedValue({
    id: 1,
    email: 'user@test.com'
  });

  const req = mockRequest({ body: { email: 'user@test.com' } });
  const res = mockResponse();
  await forgotPasswordController(req, res);

  // Verificar que se llamó a sendPasswordResetEmail
  expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
    'user@test.com',
    expect.stringContaining('token=')
  );
});
```

---

## Paso 4: Verificar con Expect

### Códigos HTTP

```typescript
// Status
expect(res.status).toHaveBeenCalledWith(200);
expect(res.status).not.toHaveBeenCalledWith(400);

// Json response
expect(res.json).toHaveBeenCalledWith({ message: 'Success' });

// Con partial match
expect(res.json).toHaveBeenCalledWith(
  expect.objectContaining({ token: expect.any(String) })
);
```

### Arrays y Objetos

```typescript
// Array contiene elemento
expect(res.json).toHaveBeenCalledWith(
  expect.arrayContaining([
    expect.objectContaining({ id: 1 })
  ])
);

// Objeto tiene estructura
expect(user).toEqual({
  id: expect.any(Number),
  email: expect.any(String),
  role: expect.stringMatching(/user|caregiver|admin/)
});
```

### Servicios Externos

```typescript
// Fue llamado
expect(mockedService.method).toHaveBeenCalled();

// Fue llamado con argumentos específicos
expect(mockedService.method).toHaveBeenCalledWith('arg1', 123);

// Número de veces
expect(mockedService.method).toHaveBeenCalledTimes(1);

// No fue llamado
expect(mockedService.method).not.toHaveBeenCalled();
```

---

## Checklist para un Buen Test

Antes de enviar un test, verificar:

- [ ] **Seguir patrón AAA** (Arrange-Act-Assert)
- [ ] **Nombre descriptivo** que explique qué se prueba
- [ ] **beforeEach con clearAllMocks()** para limpiar entre tests
- [ ] **Mocks antes de imports** en el archivo
- [ ] **Validar entrada vacía** (email, password, id, etc)
- [ ] **Caso exitoso** (happy path)
- [ ] **Casos de error** (400, 401, 403, 404, 500)
- [ ] **Verificar llamadas** a servicios/modelos
- [ ] **Usar expect()** apropiados
- [ ] **Sin print statements** (console.log, console.error)
- [ ] **Sin hardcodes mágicos** (usar variables)
- [ ] **Comentarios si es complejo**

---

## Ejemplo Completo

```typescript
import { updateDevice } from '../src/controllers/esp32Controller';
import { DispositivoModel } from '../src/models/dispositivo';
import { mockRequest, mockResponse } from './utils/mockRequestResponse';

jest.mock('../src/models/dispositivo');

const mockedDispositivo = DispositivoModel as jest.Mocked<typeof DispositivoModel>;

describe('esp32Controller', () => {
  describe('updateDevice', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('debería retornar 400 si macAddress falta', async () => {
      const req = mockRequest({
        params: {},
        body: { nombre: 'New Name' },
        user: { id: 1, role: 'admin' }
      });
      const res = mockResponse();

      await updateDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'MAC address is required' })
      );
    });

    test('debería actualizar dispositivo si usuario es admin', async () => {
      mockedDispositivo.update.mockResolvedValue({
        mac_address: 'AA:BB:CC:DD:EE:FF',
        nombre: 'Updated Device'
      } as any);

      const req = mockRequest({
        params: { macAddress: 'AA:BB:CC:DD:EE:FF' },
        body: { nombre: 'Updated Device' },
        user: { id: 1, role: 'admin' }
      });
      const res = mockResponse();

      await updateDevice(req, res);

      expect(mockedDispositivo.update).toHaveBeenCalledWith(
        'AA:BB:CC:DD:EE:FF',
        'Updated Device'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Device updated' })
      );
    });

    test('debería retornar 403 si usuario no es propietario', async () => {
      mockedDispositivo.getOwner.mockResolvedValue({ id: 2 } as any);

      const req = mockRequest({
        params: { macAddress: 'AA:BB:CC:DD:EE:FF' },
        body: { nombre: 'Updated Device' },
        user: { id: 1, role: 'usuario' }
      });
      const res = mockResponse();

      await updateDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Forbidden' })
      );
    });

    test('debería retornar 500 si BD falla', async () => {
      mockedDispositivo.update.mockRejectedValue(
        new Error('Database connection failed')
      );

      const req = mockRequest({
        params: { macAddress: 'AA:BB:CC:DD:EE:FF' },
        body: { nombre: 'Updated Device' },
        user: { id: 1, role: 'admin' }
      });
      const res = mockResponse();

      await updateDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
```

---

## Patrones Comunes

### Testing de Métodos Async

```typescript
test('debería procesar datos asynchronously', async () => {
  // Mock de promesa
  mockedService.asyncMethod.mockResolvedValue({ id: 1 });

  // Esperar el resultado
  const result = await asyncMethod();

  expect(result.id).toBe(1);
});
```

### Testing de Errores en Promises

```typescript
test('debería manejar error en promise', async () => {
  mockedService.method.mockRejectedValue(new Error('APIError'));

  await expect(method()).rejects.toThrow('API Error');
});
```

### Testing de Métodos que usan BD

```typescript
test('debería crear usuario si no existe', async () => {
  // Mock: usuario no existe primero
  mockedUsuario.findByEmail.mockResolvedValueOnce(null);
  // Mock: luego se crea
  mockedUsuario.create.mockResolvedValueOnce({ id: 1 });

  await registerUser({ email: 'new@test.com' });

  expect(mockedUsuario.create).toHaveBeenCalled();
});
```

### Testing de Timouts y Delays

```typescript
test('debería timeout después de 5 segundos', async () => {
  jest.useFakeTimers();
  const promise = method();
  jest.advanceTimersByTime(5000);
  await expect(promise).rejects.toThrow('Timeout');
  jest.useRealTimers();
});
```

---

## Nomenclatura de Tests

Usar formato: `debería [resultado] cuando [condición]`

**Buenos ejemplos**:
- `debería crear usuario cuando email no existe`
- `debería retornar 400 si email está vacío`
- `debería broadcastar evento a SSE clients`
- `debería marcar dispositivo como offline después de timeout`
- `debería permitir admin actualizar cualquier dispositivo`

**Evitar**:
- `test create` (muy vago)
- `it should work` (ambiguo)
- `test 123` (sin sentido)
- `debería no fallar` (negativo, vago)

---

## Ejecutar Tests Nuevos

```bash
# Ejecutar archivo nuevo
npm test -- newController.spec.ts

# Ejecutar specific test
npm test -- --testNamePattern="debería crear usuario"

# Watch mode while developing
npm test -- newController.spec.ts --watch

# Ver cobertura
npm test -- newController.spec.ts --coverage
```

---

## Best Practices

1. **Un concepto por test** - No probar dos cosas en un test
2. **Tests independientes** - No dependan del orden de ejecución
3. **Nombres descriptivos** - Cualquiera debe entender qué se prueba
4. **Velocidad** - Keep tests fast (< 5s total)
5. **Determinísticos** - Mismo resultado cada ejecución
6. **No hardcodes mágicos** - Usar variables con nombres claros
7. **Mocbekear sin exceso** - Solo lo necesario
8. **Verificar llamadas** - Assert que servicios fueron llamados
9. **Cubrir errores** - No solo happy path
10. **Documentación** - Comentarios en tests complejos

---

## Troubleshooting

### Mocks no funcionan

```typescript
// Problema: mock después de import
import { Service } from '../src/service';
jest.mock('../src/service');  // ← MAL

// Solución: mock ANTES del import
jest.mock('../src/service');
import { Service } from '../src/service';
```

### Mocks no se limpian

```typescript
// Problema: clearAllMocks solo en beforeAll
beforeAll(() => jest.clearAllMocks());

// Solución: limpiar en cada test
beforeEach(() => jest.clearAllMocks());
```

### Test funciona solo, falla en suite

```typescript
// Problema: État compartido entre tests
describe('Tests', () => {
  let shared = [];
  test('Test 1', () => shared.push(1));
  test('Test 2', () => expect(shared.length).toBe(0)); // Falla si Test 1 corre antes
});

// Solución: Resetear en beforeEach
beforeEach(() => {
  shared = [];
});
```

---

## Documentación Relacionada

- [TEST_DOCUMENTATION.md](./TEST_DOCUMENTATION.md) - Tests implementados
- [README.md](./README.md) - Cómo ejecutar tests
- [REFERENCES.md](./REFERENCES.md) - Referencia rápida

---

**Versión**: 1.0  
**Última actualización**: 16 de febrero de 2026  
**Autor**: Equipo QA
