#include <Arduino.h>
#include "boton.h"

const int PIN_BOTON = 14; 
unsigned long ultimoTiempoDebounce = 0;
const int retardoDebounce = 200;

void setupBoton() {
    pinMode(PIN_BOTON, INPUT_PULLUP);
}

bool verificarBotonSOS() {
    if (digitalRead(PIN_BOTON) == LOW) {
        if (millis() - ultimoTiempoDebounce > retardoDebounce) {
            ultimoTiempoDebounce = millis();
            return true;
        }
    }
    return false;
}