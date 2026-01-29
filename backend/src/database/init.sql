-- ================================================
-- StepGuard - Sistema de Detección de Caídas
-- Script de Inicialización de Base de Datos
-- ================================================

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS usuario_cuidador CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS cuidadores CASCADE;
DROP TABLE IF EXISTS dispositivos CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- ================================================
-- TABLA: admins
-- Descripción: Administradores del sistema
-- ================================================
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas por email
CREATE INDEX idx_admins_email ON admins(email);

-- ================================================
-- TABLA: cuidadores
-- Descripción: Cuidadores que pueden monitorizar usuarios
-- ================================================
CREATE TABLE cuidadores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
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
-- DATOS DE PRUEBA (OPCIONAL - COMENTAR EN PRODUCCIÓN)
-- ================================================

-- Insertar admin de prueba (password: admin123)
-- INSERT INTO admins (nombre, email, password_hash) 
-- VALUES ('Admin Principal', 'admin@stepguard.com', '$2a$10$rOzJqKxQxjLVKj0AEPmjX.yF8fXLxg7dxVMqHGzNjYvQxIxVxMUyC');

-- Insertar cuidador de prueba (password: cuidador123)
-- INSERT INTO cuidadores (nombre, email, password_hash, telefono) 
-- VALUES ('María García', 'maria@stepguard.com', '$2a$10$rOzJqKxQxjLVKj0AEPmjX.yF8fXLxg7dxVMqHGzNjYvQxIxVxMUyC', '+34 600 123 456');

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

COMMENT ON TABLE admins IS 'Administradores del sistema con permisos completos';
COMMENT ON TABLE cuidadores IS 'Cuidadores que monitorizan el estado de los usuarios';
COMMENT ON TABLE usuarios IS 'Usuarios del sistema (personas mayores) asociados a dispositivos';
COMMENT ON TABLE dispositivos IS 'Dispositivos ESP32 para detección de caídas';
COMMENT ON TABLE usuario_cuidador IS 'Relación muchos-a-muchos entre usuarios y cuidadores';

-- ================================================
-- FIN DEL SCRIPT
-- ================================================

-- Para ejecutar este script:
-- psql -U postgres -d stepguard -f init.sql
