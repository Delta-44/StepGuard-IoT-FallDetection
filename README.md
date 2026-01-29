
---

## 📂 Estructura del Proyecto

El repositorio está organizado de la siguiente manera para facilitar el desarrollo colaborativo:

```text
fall-detection-system/
├── device/                # Trabajo del Dev 1: Firmware ESP32 y sensores
│   ├── src/               # Código fuente (.ino / .cpp)
│   └── lib/               # Librerías del sensor MPU6050
├── backend/               # Trabajo de Dev 2 y 3: API REST y Base de Datos
│   ├── src/
│   │   ├── controllers/   # Lógica de endpoints y gestión de datos
│   │   ├── models/        # Definición de tablas SQL (ER)
│   │   └── middleware/    # Protección JWT y gestión de Roles
│   └── tests/             # Pruebas de funcionamiento de la API
├── frontend/              # Trabajo de Dev 4 y 5: Aplicación Web
│   ├── src/
│   │   ├── components/    # Elementos visuales (Botones, gráficas)
│   │   ├── services/      # Conexión con el backend (API Fetch/Axios)
│   │   └── views/         # Pantallas: Dashboard, Login, Alertas
├── docs/                  # Trabajo de Dev 6 y 7: Documentación y Extras
│   ├── diagrams/          # Arquitectura, ER y Flujo de caídas
│   └── manuals/           # Guías de usuario y técnica
└── README.md              # Guía principal del proyecto
```

## 🔄 Normas de Git
Para trabajar en este equipo de 7 personas, seguimos estas reglas:
1. **Ramas Principales:** `main` (solo estable) y `develop` (desarrollo).
2. **Ramas de Tarea:** Crear ramas tipo `feature/nombre-tarea` desde `develop`.
3. **Pull Requests:** Obligatorio que otro compañero revise el código antes del Merge.
4. **Commits:** Deben ser claros (ej: "feat: añadir endpoint de login").

## 👥 Equipo
* **Dev 1:** IoT & Sensores.
* **Dev 2:** Backend & API.
* **Dev 3:** Base de Datos.
* **Dev 4:** Lógica de Frontend.
* **Dev 5:** UI/UX & Visualización.
* **Dev 6:** Documentación & Calidad.
* **Dev 7:** Funcionalidades Extra.

## 🚀 Instalación Rápida
* **Hardware:** Carga el código de `/device` en tu ESP32 configurando el Wi-Fi.
* **Servidor:** Instala dependencias en `/backend` e inicia con `npm start`.
* **Web:** Ejecuta `npm install` en `/frontend` y lanza el entorno de desarrollo.
