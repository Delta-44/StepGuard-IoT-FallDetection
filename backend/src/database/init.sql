-- ================================================
-- StepGuard - Sistema de Detección de Caídas
-- Script de Inicialización de Base de Datos
-- ================================================

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS notificaciones CASCADE;
DROP TABLE IF EXISTS eventos_caida CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS usuario_cuidador CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS cuidadores CASCADE;
DROP TABLE IF EXISTS dispositivos CASCADE;

-- ================================================
-- TABLA: cuidadores
-- Descripción: Cuidadores que pueden monitorizar usuarios
-- Los cuidadores con is_admin=true tienen permisos de administrador
-- ================================================
CREATE TABLE cuidadores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    is_admin BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas por email
CREATE INDEX idx_cuidadores_email ON cuidadores(email);

-- ================================================
-- TABLA: dispositivos
-- Descripción: Dispositivos ESP32 para detección de caídas
-- ================================================
CREATE TABLE dispositivos (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) UNIQUE NOT NULL, -- Ej: "ESP32-001"
    mac_address VARCHAR(17) UNIQUE NOT NULL, -- Ej: "AA:BB:CC:DD:EE:FF"
    nombre VARCHAR(100) NOT NULL,
    ubicacion VARCHAR(200),
    estado VARCHAR(20) DEFAULT 'offline' CHECK (estado IN ('online', 'offline', 'maintenance')),
    firmware_version VARCHAR(20),
    
    -- Configuración del dispositivo
    sensibilidad_caida VARCHAR(10) DEFAULT 'medium' CHECK (sensibilidad_caida IN ('low', 'medium', 'high')),
    intervalo_reporte_ms INTEGER DEFAULT 60000,
    led_habilitado BOOLEAN DEFAULT true,
    
    -- Timestamps
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_conexion TIMESTAMP
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_dispositivos_device_id ON dispositivos(device_id);
CREATE INDEX idx_dispositivos_mac_address ON dispositivos(mac_address);
CREATE INDEX idx_dispositivos_estado ON dispositivos(estado);

-- ================================================
-- TABLA: usuarios
-- Descripción: Usuarios del sistema (personas mayores)
-- ================================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    edad INTEGER CHECK (edad > 0 AND edad < 150),
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    
    -- Relación con dispositivo (un usuario tiene un dispositivo)
    dispositivo_id INTEGER REFERENCES dispositivos(id) ON DELETE SET NULL,
    
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_dispositivo_id ON usuarios(dispositivo_id);

-- ================================================
-- TABLA: usuario_cuidador
-- Descripción: Relación muchos-a-muchos entre usuarios y cuidadores
-- Un cuidador puede tener varios usuarios asignados
-- Un usuario puede tener varios cuidadores asignados
-- ================================================
CREATE TABLE usuario_cuidador (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    cuidador_id INTEGER NOT NULL REFERENCES cuidadores(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Evitar duplicados
    UNIQUE(usuario_id, cuidador_id)
);

-- Índices para mejorar rendimiento de las consultas
CREATE INDEX idx_usuario_cuidador_usuario ON usuario_cuidador(usuario_id);
CREATE INDEX idx_usuario_cuidador_cuidador ON usuario_cuidador(cuidador_id);

-- ================================================
-- TABLA: eventos_caida
-- Descripción: Registro histórico de caídas detectadas por los dispositivos
-- ================================================
CREATE TABLE eventos_caida (
    id SERIAL PRIMARY KEY,
    dispositivo_id INTEGER NOT NULL REFERENCES dispositivos(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Datos del acelerómetro
    acc_x DECIMAL(10,2),
    acc_y DECIMAL(10,2),
    acc_z DECIMAL(10,2),
    
    -- Severidad y estado
    severidad VARCHAR(20) DEFAULT 'medium' CHECK (severidad IN ('low', 'medium', 'high', 'critical')),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'atendida', 'falsa_alarma', 'ignorada')),
    
    -- Información adicional
    ubicacion VARCHAR(200),
    notas TEXT,
    
    -- Atención de la alerta
    atendido_por INTEGER REFERENCES cuidadores(id) ON DELETE SET NULL,
    fecha_atencion TIMESTAMP,
    
    -- Timestamps
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_eventos_fecha ON eventos_caida(fecha_hora DESC);
CREATE INDEX idx_eventos_usuario ON eventos_caida(usuario_id, fecha_hora DESC);
CREATE INDEX idx_eventos_dispositivo ON eventos_caida(dispositivo_id, fecha_hora DESC);
CREATE INDEX idx_eventos_estado ON eventos_caida(estado);
CREATE INDEX idx_eventos_severidad ON eventos_caida(severidad);

-- ================================================
-- TABLA: notificaciones
-- Descripción: Registro de notificaciones enviadas a cuidadores
-- ================================================
CREATE TABLE notificaciones (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER REFERENCES eventos_caida(id) ON DELETE CASCADE,
    cuidador_id INTEGER NOT NULL REFERENCES cuidadores(id) ON DELETE CASCADE,
    
    -- Tipo y estado
    tipo VARCHAR(20) DEFAULT 'app' CHECK (tipo IN ('email', 'sms', 'push', 'app')),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviada', 'entregada', 'leida', 'fallida')),
    
    -- Contenido
    asunto VARCHAR(200),
    contenido TEXT,
    
    -- Timestamps
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega TIMESTAMP,
    fecha_lectura TIMESTAMP,
    
    -- Información técnica
    error_mensaje TEXT,
    intentos_envio INTEGER DEFAULT 0
);

-- Índices para consultas frecuentes
CREATE INDEX idx_notificaciones_evento ON notificaciones(evento_id);
CREATE INDEX idx_notificaciones_cuidador ON notificaciones(cuidador_id, fecha_envio DESC);
CREATE INDEX idx_notificaciones_estado ON notificaciones(estado);
CREATE INDEX idx_notificaciones_no_leidas ON notificaciones(cuidador_id, fecha_lectura) WHERE fecha_lectura IS NULL;

-- ================================================
-- TABLA: audit_log
-- Descripción: Registro de auditoría de todas las acciones importantes del sistema
-- ================================================
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    
    -- Qué cambió
    tabla_afectada VARCHAR(50) NOT NULL,
    accion VARCHAR(20) NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS')),
    registro_id INTEGER,
    
    -- Quién lo hizo
    usuario_tipo VARCHAR(20) CHECK (usuario_tipo IN ('admin', 'cuidador', 'usuario', 'sistema', 'dispositivo')),
    usuario_id INTEGER,
    usuario_email VARCHAR(100),
    
    -- Datos del cambio
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    descripcion TEXT,
    
    -- Información de contexto
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamp
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas de auditoría
CREATE INDEX idx_audit_fecha ON audit_log(fecha_hora DESC);
CREATE INDEX idx_audit_tabla ON audit_log(tabla_afectada, fecha_hora DESC);
CREATE INDEX idx_audit_usuario ON audit_log(usuario_tipo, usuario_id, fecha_hora DESC);
CREATE INDEX idx_audit_accion ON audit_log(accion, fecha_hora DESC);

-- ================================================
-- DATOS DE PRUEBA (OPCIONAL - COMENTAR EN PRODUCCIÓN)
-- ================================================

-- Insertar admin de prueba (password: admin123)
-- INSERT INTO cuidadores (nombre, email, password_hash, telefono, is_admin) 
-- VALUES ('Admin Principal', 'admin@stepguard.com', '$2a$10$rOzJqKxQxjLVKj0AEPmjX.yF8fXLxg7dxVMqHGzNjYvQxIxVxMUyC', '+34 600 000 000', true);

-- Insertar cuidador de prueba (password: cuidador123)
-- INSERT INTO cuidadores (nombre, email, password_hash, telefono, is_admin) 
-- VALUES ('María García', 'maria@stepguard.com', '$2a$10$rOzJqKxQxjLVKj0AEPmjX.yF8fXLxg7dxVMqHGzNjYvQxIxVxMUyC', '+34 600 123 456', false);

-- Insertar dispositivo de prueba
-- INSERT INTO dispositivos (device_id, mac_address, nombre, ubicacion) 
-- VALUES ('ESP32-001', 'AA:BB:CC:DD:EE:FF', 'Dispositivo Principal', 'Sala de estar');

-- Insertar usuario de prueba (password: usuario123)
-- INSERT INTO usuarios (nombre, email, password_hash, edad, direccion, telefono, dispositivo_id) 
-- VALUES ('Juan Pérez', 'juan@stepguard.com', '$2a$10$rOzJqKxQxjLVKj0AEPmjX.yF8fXLxg7dxVMqHGzNjYvQxIxVxMUyC', 75, 'Calle Mayor 123', '+34 600 654 321', 1);

-- Asignar cuidador a usuario
-- INSERT INTO usuario_cuidador (usuario_id, cuidador_id) 
-- VALUES (1, 1);

-- ================================================
-- COMENTARIOS Y METADATA
-- ================================================

COMMENT ON TABLE cuidadores IS 'Cuidadores que monitorizan el estado de los usuarios. Campo is_admin=true indica permisos de administrador';
COMMENT ON TABLE usuarios IS 'Usuarios del sistema (personas mayores) asociados a dispositivos';
COMMENT ON TABLE dispositivos IS 'Dispositivos ESP32 para detección de caídas';
COMMENT ON TABLE usuario_cuidador IS 'Relación muchos-a-muchos entre usuarios y cuidadores';
COMMENT ON TABLE eventos_caida IS 'Registro histórico de todas las caídas detectadas por los dispositivos';
COMMENT ON TABLE notificaciones IS 'Registro de notificaciones enviadas a cuidadores sobre eventos de caída';
COMMENT ON TABLE audit_log IS 'Registro de auditoría de todas las acciones importantes del sistema para trazabilidad y seguridad';

-- ================================================
-- FIN DEL SCRIPT
-- ================================================

-- Para ejecutar este script:
-- psql -U postgres -d stepguard -f init.sql
