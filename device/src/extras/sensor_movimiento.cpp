#include <Arduino.h>
#include "sensor_movimiento.h"

const int PIN_PIR = 13;

void setupPIR() {
    pinMode(PIN_PIR, INPUT);
}

bool hayMovimiento() {
    return digitalRead(PIN_PIR) == HIGH;
}