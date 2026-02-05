Backend — Documentación

Resumen: API Express en TypeScript que gestiona autenticación, registro, recuperación de contraseña y usuarios. A continuación se documentan brevemente los ficheros principales en src/ y cómo ejecutar los tests existentes sin modificar código.

Estructura y archivos relevantes

- src/controllers/authController.ts: Maneja recuperación y reseteo de contraseña.
  - Endpoints esperados: POST /api/auth/forgot-password (body: { email }), POST /api/auth/reset-password (body: { token, password }).
  - Lógica clave: busca usuario en UsuarioModel o CuidadorModel, genera JWT con propósito reset-password, valida password_last_changed_at antes de aceptar reseteo.

- src/controllers/googleAuthController.ts: Flujo de autenticación con Google.
  - Funciones: googleAuthRedirect, googleAuthCallback, googleLogin.
  - Lógica: verifica idToken con google-auth-library, busca o crea Usuario/Cuidador, genera JWT de sesión.

- src/controllers/registerController.ts: Endpoints para registro de usuario y cuidador.
  - registerUsuario: valida campos, calcula fecha_nacimiento a partir de edad si procede, hashea la contraseña y crea usuario.
  - registerCuidador: valida campos, hashea contraseña y crea cuidador.

- src/controllers/userController.ts:
  - getUsers: devuelve lista combinada de usuarios y cuidadores sin hashes de password.
  - getUserById: devuelve usuario con datos del dispositivo (si existe) en una estructura limpia.

- src/models/usuario.ts y src/models/cuidador.ts:
  - Modelos con métodos CRUD y helpers (findByEmail, create, updatePassword, findAll, etc.).
  - Interaccionan con la BD mediante query desde src/config/database.

- src/routes/userRoutes.ts:
  - Rutas protegidas que utilizan auth middleware: GET /api/users/ y GET /api/users/:id.

- Scripts de ayuda / tests (no requieren cambios de código):
  - src/check-test-user.ts: script que comprueba/crea un usuario de prueba en BD.
  - src/test-jwt-password-reset.ts: script de pruebas de integración (usa axios) para el flujo de recuperación de contraseña.
  - src/test-unified-auth.ts: script con supertest que monta una app express y prueba registros y login.
  - src/test-user-endpoint.ts: script con supertest que prueba endpoints de usuario y obtención de info de dispositivo.

Variables de entorno relevantes

- JWT_SECRET: clave para firmar JWT (se usa en controladores).
- GOOGLE_CLIENT_ID, GOOGLE_SECRET: clientes Google OAuth en googleAuthController.
- CORS_ORIGIN: frontend base URL usada para generar links de reset.

