Device (PlatformIO) — Documentación 

Resumen: Código en C++ para microcontrolador (PlatformIO). Gestiona acelerómetro, inclinación, pantalla, red y vibrador.

Archivos principales (src/)

- acelerometro.cpp / acelerometro.h: Lectura y filtrado de aceleraciones.
- inclinacion.cpp / inclinacion.h: Cálculos de ángulo/inclinación basados en acelerómetro.
- pantalla.cpp / pantalla.h: Manejo de la pantalla (UI mínima para estado y configuración).
- red.cpp / red.h: Conectividad (Wi-Fi / servidor / envío de eventos).
- main.cpp: Inicialización, loop principal y coordinación de módulos.
- vibrador.cpp / vibrador.h: Control del motor vibrador para alertas.

Cómo compilar y flashear (PlatformIO)

1. Instalar PlatformIO (VSCode extension o CLI)

2. Compilar:

```powershell
cd device
pio run
```

3. Subir a placa:

```powershell
pio run -t upload
```

Notas sobre tests en dispositivo

- Tests unitarios estilo host no están incluidos. Para pruebas automáticas se puede:
  - Extraer lógica no-hardware a funciones testables y ejecutar con Unity+PlatformIO test runner.
  - Emular sensores si se quiere probar cálculo de caídas sin hardware.

Si deseas, puedo generar una suite inicial de tests (Host/Unity) para la lógica de `inclinacion` y `acelerometro` y ejemplos de CI.
