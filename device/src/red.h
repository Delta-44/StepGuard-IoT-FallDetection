#ifndef RED_H
#define RED_H

#include <Arduino.h>

void setupRed();
void loopRed(); // Necesario para mantener la conexión viva
void enviarReporteMQTT(int contador, float fuerza);
String obtenerHoraNTP();

#endif