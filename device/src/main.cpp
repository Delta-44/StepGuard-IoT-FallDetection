#include <Arduino.h>
#include "boton.h"
#include "inclinacion.h"
#include "vibrador.h"

// Variables para controlar la frecuencia de los mensajes en consola
unsigned long ultimoAvisoInclinacion = 0;
const int intervaloAviso = 1000; // Enviar mensaje cada 1000ms (1 segundo)

void setup() {
    Serial.begin(115200);

    setupBoton();       // D14
    setupInclinacion(); // D32 y D33
    setupVibrador();    // D25

    Serial.println("--- StepGuard: Monitor de Inclinación y SOS Activo ---");
}

void loop() {
    // 1. REVISAR BOTÓN SOS (Prioridad)
    if (verificarBotonSOS()) {
        Serial.println("[ALERTA] SOS: Botón pulsado manualmente.");
        activarVibrador(500);
    }

    // 2. REVISAR INCLINACIÓN
    if (estaInclinado()) {
        // Ejecuta el parpadeo rápido del LED del sensor (programado en inclinacion.cpp)
        parpadearLedInclinacion(); 

        // Enviar mensaje por consola cada 1 segundo mientras siga inclinado
        if (millis() - ultimoAvisoInclinacion >= intervaloAviso) {
            Serial.println("[!!!] ALERTA: El dispositivo detecta inclinación constante (Posible caída)");
            ultimoAvisoInclinacion = millis();
        }
    } 
    else {
        // Si vuelve a estar vertical, apagamos el LED y reseteamos el temporizador
        controlarLedInclinacion(false);
        
        // Opcional: Avisar solo una vez cuando se recupera la posición
        static bool estabaInclinado = false;
        if (estabaInclinado) {
            Serial.println("[OK] Dispositivo recuperado: Posición Vertical.");
            estabaInclinado = false;
        }
        
        if (!estaInclinado()) {
            estabaInclinado = false;
        }
    }

    // Pequeño delay para estabilidad del sistema
    delay(10); 
}