#include <Arduino.h>
#include "boton.h"
#include "sensor_movimiento.h"

const int LED_PLACA = 2;

void setup() {
    Serial.begin(115200);
    
    // Inicializar módulos
    setupBoton();
    setupPIR();
    pinMode(LED_PLACA, OUTPUT);

    Serial.println("StepGuard: Sistema Modular Iniciado.");
    Serial.println("Calibrando PIR...");
    delay(10000);
    Serial.println("Listo.");
}

void loop() {
    // 1. Revisar Botón SOS
    if (verificarBotonSOS()) {
        Serial.println("[ALERTA] Botón SOS presionado en D14!");
        digitalWrite(LED_PLACA, HIGH);
        delay(1000); // Feedback visual
        digitalWrite(LED_PLACA, LOW);
    }

    // 2. Revisar Movimiento
    if (hayMovimiento()) {
        Serial.println("[INFO] Movimiento detectado.");
    }

    delay(100); // Estabilidad
}