# 🎯 StepGuard IoT - Frontend

Este es el módulo de interfaz web para el sistema de detección de caídas **StepGuard IoT**.
Desarrollado con **Angular 17+** utilizando la nueva arquitectura basada en **Signals** y **Control Flow** (`@if`, `@for`).

## 🚀 Características Implementadas

### 1. Autenticación y Seguridad
* **Login Simulado:** Soporte para roles diferenciados.
    * Admin: `admin@test.com` / `123456`
    * Cuidador: `cuidador@test.com` / `123456`
* **Guards:** Protección de rutas (`authGuard`) para evitar accesos no autorizados.
* **Gestión de Sesión:** Persistencia básica con `localStorage`.

### 2. Dashboard Reactivo
* Visualización de alertas en tiempo real.
* **Sistema de Prioridad:** Cambio de color según severidad (Crítica/Advertencia).
* **Estado Global:** Barra de estado que cambia a ROJO si hay alertas críticas sin atender.

### 3. Gestión de Dispositivos (IoT)
* Listado de sensores con estado (`ONLINE`/`OFFLINE`) y nivel de batería.
* **Control Remoto:** Funcionalidad para "Reiniciar Dispositivo" (Exclusiva para Administradores).

### 4. Gestión de Usuarios (CRUD)
* Listado de personal y usuarios del sistema.
* **Creación Rápida:** Botón para añadir nuevos cuidadores o usuarios.
* **Eliminación:** Capacidad de borrar usuarios (Protegido: no puedes borrarte a ti mismo ni a otros admins).

## 🛠️ Tecnologías Clave

* **Angular Signals:** Para la gestión de estado reactivo (`signal`, `computed`).
* **Control Flow:** Nueva sintaxis `@if` y `@for` para mejor rendimiento en plantillas.
* **RxJS:** Simulación de latencia de red y manejo de observables.
* **Standalone Components:** Arquitectura moderna sin `NgModules`.

## 📦 Instalación y Ejecución

1.  Instalar dependencias:
    ```bash
    npm install
    ```

2.  Arrancar servidor de desarrollo:
    ```bash
    ng serve
    ```

3.  Abrir navegador en `http://localhost:4200`

## 🔗 Integración con Backend (Futuro)

Actualmente el sistema usa `Mock Services` (`api.service.ts`, `user.service.ts`) para simular la respuesta del servidor.
Para conectar con el Backend real, se deben actualizar las URLs en estos servicios para apuntar a la API REST (ej: `http://localhost:3000/api/...`).

---
**Proyecto:** Sistema Inteligente de Detección de Caídas
**Estado:** Lógica Frontend Finalizada ✅