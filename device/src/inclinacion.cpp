#include <Arduino.h>
#include "inclinacion.h"

const int PIN_TILT = 32; // Pin de la señal L
const int PIN_LED_CUP = 33; // Pin del LED S

void setupInclinacion() {
    pinMode(PIN_TILT, INPUT_PULLUP);
    pinMode(PIN_LED_CUP, OUTPUT);
}

bool estaInclinado() {
    // El sensor suele dar LOW cuando está inclinado
    return digitalRead(PIN_TILT) == LOW;
}

void controlarLedInclinacion(bool encender) {
    digitalWrite(PIN_LED_CUP, encender ? HIGH : LOW);
}