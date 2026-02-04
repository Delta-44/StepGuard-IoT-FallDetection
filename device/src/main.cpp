#include <Arduino.h>
#include "boton.h"
#include "inclinacion.h"
#include "acelerometro.h"
#include "vibrador.h"

void setup() {
    Serial.begin(115200);
    
    setupBoton();
    setupInclinacion();
    setupAcelerometro();
    setupVibrador(); // <--- REACTIVADO (Pin D25)

    Serial.println("StepGuard: Modo Test de Sensibilidad.");
}

void loop() {
    // 1. SOS MANUAL
    if (verificarBotonSOS()) {
        Serial.println("SOS MANUAL");
        activarVibrador(500);
    }

    // 2. DETECCIÓN DE CAÍDA (Sensible)
    if (detectarCaida()) {
        // Si detecta movimiento brusco, hacemos una vibración corta de aviso
        activarVibrador(100); 

        // Si además está inclinado, es caída confirmada
        if (estaInclinado()) {
            Serial.println("¡¡¡ CAÍDA CONFIRMADA !!!");
            activarVibrador(1000); // Vibración larga
        }
    }

    // 3. MONITOR DE INCLINACIÓN (Mensaje cada segundo si está inclinado)
    if (estaInclinado()) {
        parpadearLedInclinacion();
        static unsigned long lastMsg = 0;
        if (millis() - lastMsg > 1000) {
            Serial.println("Estado: Inclinado/Suelo");
            lastMsg = millis();
        }
    } else {
        controlarLedInclinacion(false);
    }

    delay(10);
}