# StepGuard: Sistema Inteligente de Detección de Caídas 🛡️👴

## 📋 Descripción del Proyecto
[cite_start]StepGuard es una solución integral de tecnología asistencial diseñada para mejorar la seguridad y autonomía de las personas mayores o con movilidad reducida[cite: 3]. [cite_start]El sistema utiliza dispositivos IoT para monitorizar movimientos en tiempo real, detectar caídas de forma automática y alertar a los cuidadores a través de una plataforma web centralizada[cite: 4, 5, 7].

## 🏗️ Estructura del Repositorio
[cite_start]Siguiendo las mejores prácticas de organización, el proyecto se divide en las siguientes carpetas[cite: 14]:

- [cite_start]`📂 device/`: Código fuente para el microcontrolador ESP32 (C++/Arduino)[cite: 16, 17].
- [cite_start]`📂 backend/`: API REST desarrollada en [Node.js/Spring Boot] y lógica de negocio[cite: 18, 19].
- [cite_start]`📂 frontend/`: Aplicación web interactiva en [React/Angular][cite: 20, 21].
- [cite_start]`📂 docs/`: Documentación técnica, diagramas de arquitectura, ER y manuales[cite: 22, 23].

## 🚀 Tecnologías Utilizadas
### [cite_start]Hardware [cite: 38]
- [cite_start]**Microcontrolador:** ESP32[cite: 40].
- [cite_start]**Sensores:** Acelerómetro MPU6050 e Inclinómetro[cite: 42, 44].
- [cite_start]**Actuadores:** LED/Buzzer de alerta y Pulsador de emergencia[cite: 45, 46].

### Software
- [cite_start]**Backend:** Node.js + Express + TypeScript / Spring Boot[cite: 63].
- [cite_start]**Frontend:** Angular / React con diseño responsive[cite: 80, 81].
- [cite_start]**Base de Datos:** Relacional (SQL)[cite: 77].
- [cite_start]**Comunicación:** HTTP REST / MQTT[cite: 51].

## 🛠️ Instalación y Configuración
### 1. Dispositivo (IoT)
1. Navega a `/device`.
2. Abre el código en Arduino IDE o PlatformIO.
3. Instala las librerías necesarias (Adafruit MPU6050, WiFi, etc.).
4. Configura tus credenciales de Wi-Fi y la URL de la API en el archivo de configuración.

### 2. Backend (API)
1. Navega a `/backend`.
2. Ejecuta `npm install` (si es Node.js) o importa el proyecto Maven/Gradle (si es Spring).
3. Configura las variables de entorno (`.env`) para la conexión a la base de datos y JWT.
4. Inicia el servidor con `npm run dev` o el comando correspondiente.

### 3. Frontend (Web)
1. Navega a `/frontend`.
2. Ejecuta `npm install`.
3. Inicia la aplicación con `npm start` o `ng serve`.

## 📡 Protocolo de Datos (IoT → Backend)
[cite_start]El dispositivo envía los datos en formato JSON mediante un `POST` al endpoint `/api/events` [cite: 53-60]:

```latex
\{
  "deviceId": "ESP32-001",
  "accX": -1.23,
  "accY": 0.45,
  "accZ": 9.81,
  "fallDetected": true
\}
