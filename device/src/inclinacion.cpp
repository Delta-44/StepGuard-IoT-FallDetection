#include <Arduino.h>
#include "inclinacion.h"

const int PIN_LECTURA = 32;    
const int PIN_LED_SENSOR = 33; 

// Variables para el parpadeo sin delay
unsigned long anteriorMillis = 0;
const long intervalo = 100; // Velocidad del parpadeo (100ms = muy rápido)
bool estadoLed = LOW;

void setupInclinacion() {
    pinMode(PIN_LECTURA, INPUT_PULLUP);
    pinMode(PIN_LED_SENSOR, OUTPUT);
}

bool estaInclinado() {
    return digitalRead(PIN_LECTURA) == LOW; 
}

void controlarLedInclinacion(bool encender) {
    digitalWrite(PIN_LED_SENSOR, encender ? HIGH : LOW);
}

void parpadearLedInclinacion() {
    unsigned long actualMillis = millis();
    if (actualMillis - anteriorMillis >= intervalo) {
        anteriorMillis = actualMillis;
        estadoLed = !estadoLed; // Invierte el estado
        digitalWrite(PIN_LED_SENSOR, estadoLed);
    }
}