#include <Arduino.h>
#include "inclinacion.h"

// Pines
const int PIN_LECTURA = 32;    
const int PIN_LED_SENSOR = 33; 

// Variables para el parpadeo 
unsigned long anteriorMillis = 0;
const long intervalo = 100; // Velocidad del parpadeo
bool estadoLed = LOW; // Low = apagado | High = encendido

/// @brief Configura los pines para el sensor de inclinación y el LED
void setupInclinacion() {
    pinMode(PIN_LECTURA, INPUT_PULLUP);
    pinMode(PIN_LED_SENSOR, OUTPUT);
}

/// @brief Verifica si el sensor de inclinación está activado
/// @return true si está inclinado, false si no
bool estaInclinado() {
    return digitalRead(PIN_LECTURA) == LOW; 
}

/// @brief Controla el estado del LED indicador de inclinación
/// @param encender true para encender el LED, false para apagarlo
void controlarLedInclinacion(bool encender) {
    digitalWrite(PIN_LED_SENSOR, encender ? HIGH : LOW); 
}

/// @brief Hace parpadear el LED indicador de inclinación
void parpadearLedInclinacion() {
    unsigned long actualMillis = millis(); // Obtener el tiempo actual
    if (actualMillis - anteriorMillis >= intervalo) { // Si ah pasado el intervalo
        anteriorMillis = actualMillis; // Guardar el tiempo del último cambio
        estadoLed = !estadoLed; // Invierte el estado
        digitalWrite(PIN_LED_SENSOR, estadoLed); // Actualizar el LED
    }
}