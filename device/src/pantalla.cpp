#include <MD_MAX72xx.h>
#include <SPI.h>
#include "pantalla.h"

// Si se ve raro, prueba cambiar FC16_HW por GENERIC_HW
#define HARDWARE_TYPE MD_MAX72XX::FC16_HW 
#define MAX_DEVICES 1

#define DATA_PIN  23  // DIN
#define CS_PIN    5   // CS
#define CLK_PIN   18  // CLK

MD_MAX72XX mx = MD_MAX72XX(HARDWARE_TYPE, DATA_PIN, CLK_PIN, CS_PIN, MAX_DEVICES);

// Iconos definidos bit a bit (8x8)
uint8_t caraOK[8] = {0x3C, 0x42, 0xA5, 0x81, 0xA5, 0x99, 0x42, 0x3C};
uint8_t iconoSOS[8] = {0x81, 0x42, 0x24, 0x18, 0x18, 0x24, 0x42, 0x81}; 
uint8_t iconoCaida[8] = {0x18, 0x3C, 0x7E, 0xFF, 0x18, 0x18, 0x18, 0x18};

void setupPantalla() {
    mx.begin();
    mx.control(MD_MAX72XX::TEST, MD_MAX72XX::OFF); // Asegurar que el modo test esté apagado
    mx.control(MD_MAX72XX::INTENSITY, 2);          // Brillo cómodo
    mx.clear();
    Serial.println("Pantalla StepGuard: Lista.");
}

void mostrarIconoOK() {
    mx.clear();
    for (int i = 0; i < 8; i++) mx.setRow(0, i, caraOK[i]);
}

void mostrarIconoSOS() {
    mx.clear();
    for (int i = 0; i < 8; i++) mx.setRow(0, i, iconoSOS[i]);
}

void mostrarIconoCaida() {
    mx.clear();
    for (int i = 0; i < 8; i++) mx.setRow(0, i, iconoCaida[i]);
}

void limpiarPantalla() {
    mx.clear();
}