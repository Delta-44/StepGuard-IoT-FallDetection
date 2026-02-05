#include <Arduino.h>
#include "vibrador.h"

const int PIN_VIBRADOR = 25;

void setupVibrador() {
    pinMode(PIN_VIBRADOR, OUTPUT);
    digitalWrite(PIN_VIBRADOR, LOW); // Empezar apagado
}

void activarVibrador(int duracionMs) {
    digitalWrite(PIN_VIBRADOR, HIGH);
    delay(duracionMs);
    digitalWrite(PIN_VIBRADOR, LOW);
}