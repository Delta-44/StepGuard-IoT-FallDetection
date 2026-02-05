#include <Arduino.h>
#include "boton.h"

// Pin del boton
const int PIN_BOTON = 14;

// Variables para el debounce del botón (eliminar falsas pulsaciones)
unsigned long ultimoTiempoDebounce = 0;
const int retardoDebounce = 200;

/// @brief Configura el pin del botón como entrada pull-up (un boton basicamente)
void setupBoton() {
    pinMode(PIN_BOTON, INPUT_PULLUP);
}

/// @brief Verifica si el botón SOS ha sido pulsado, con debounce para evitar falsos positivos
/// @return true si el botón ha sido pulsado, false en caso contrario
bool verificarBotonSOS() {
    if (digitalRead(PIN_BOTON) == LOW) { // Botón pulsado
        if (millis() - ultimoTiempoDebounce > retardoDebounce) { // Revisar si ha pasado el tiempo de debounce
            ultimoTiempoDebounce = millis(); // Actualizar el tiempo del último debounce
            return true; 
        }
    }
    return false;
}