#include <Arduino.h>
#include "boton.h"
#include "sensor_movimiento.h"
#include "vibrador.h"
#include "inclinacion.h"

void setup() {
    Serial.begin(115200);
    
    setupBoton();       
    setupPIR();         
    setupVibrador();    
    setupInclinacion(); 

    Serial.println("StepGuard: Sistema con Sensor de Inclinación Listo.");
}

void loop() {
    // 1. SOS
    if (verificarBotonSOS()) {
        Serial.println("[ALERTA] SOS!");
        activarVibrador(500);
    }

    // 2. INCLINACIÓN (Detección de posición)
    if (estaInclinado()) {
        Serial.println("[!] AVISO: Dispositivo inclinado / Usuario en el suelo");
        controlarLedInclinacion(true); // Enciende el LED del propio sensor
        activarVibrador(200);          // Vibra para avisar
    } else {
        controlarLedInclinacion(false);
    }

    // 3. MOVIMIENTO
    if (hayMovimiento()) {
        Serial.println("Movimiento detectado.");
    }

    delay(200);
}