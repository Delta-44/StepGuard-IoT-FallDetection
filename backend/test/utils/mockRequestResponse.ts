export function mockRequest(data: any = {}) {
  return {
    body: data.body || {},
    params: data.params || {},
    query: data.query || {},
    headers: data.headers || {},
    user: data.user || null,
    cookies: data.cookies || {},
    method: data.method || 'GET'
  } as any;
}

export function mockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.locals = {};
  return res as any;
}

// Builder para crear datos de usuario de prueba
export function createMockUser(overrides: any = {}) {
  return {
    id: 1,
    nombre: 'Test User',
    email: 'test@example.com',
    password_hash: 'hashed_password',
    rol: 'usuario',
    edad: 30,
    genero: 'M',
    dispositivo_id: null,
    activo: true,
    fecha_creacion: new Date(),
    ...overrides
  };
}

// Builder para crear datos de cuidador de prueba
export function createMockCuidador(overrides: any = {}) {
  return {
    id: 1,
    nombre: 'Test Caregiver',
    email: 'caregiver@example.com',
    password_hash: 'hashed_password',
    is_admin: false,
    activo: true,
    fecha_creacion: new Date(),
    ...overrides
  };
}

// Builder para crear datos de dispositivo de prueba
export function createMockDispositivo(overrides: any = {}) {
  return {
    id: 1,
    device_id: 'ESP32-001',
    nombre: 'Pulsera Inteligente',
    usuario_id: 1,
    estado: 'activo',
    bateria: 85,
    fecha_registro: new Date(),
    ...overrides
  };
}
