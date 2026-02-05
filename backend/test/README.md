# Tests del Backend

## Estructura

Los tests unitarios se encuentran en la carpeta `test/` y cubren los controladores principales:

- `authController.spec.ts`: Tests para recuperación y reseteo de contraseña.
- `registerController.spec.ts`: Tests para registro de usuarios y cuidadores.
- `userController.spec.ts`: Tests para obtención de usuarios y detalles con dispositivo.
- `utils/mockRequestResponse.ts`: Utilidades para crear mocks de Request/Response de Express.

## Instalar dependencias de test

```powershell
cd backend
npm install
```

Asegúrate de que `jest`, `ts-jest` y `@types/jest` estén en `devDependencies`.

## Ejecutar todos los tests

```powershell
npm test
```

## Ejecutar tests con cobertura

```powershell
npm test -- --coverage
```

## Ejecutar un archivo de test específico

```powershell
npx jest test/authController.spec.ts
npx jest test/registerController.spec.ts
npx jest test/userController.spec.ts
```

## Estructura de un test

Cada archivo usa:
- `jest.mock()`: Para mockear modelos y servicios externos.
- `mockRequest()` y `mockResponse()`: Utilidades que crean objetos simulados de Express.
- `describe()` y `test()`: Bloques estándar de Jest.
- `expect()`: Assertions para verificar el comportamiento.

Ejemplo:
```typescript
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
