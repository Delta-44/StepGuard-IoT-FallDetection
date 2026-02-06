#ifndef RED_H
#define RED_H
#include <vector>
#include <Arduino.h>
#include <vector>

void setupRed();
void loopReconnect(); 
void enviarReporteMQTT(bool sos_presionado, bool caida_detectada, const std::vector<float>& impactos);
String obtenerHoraNTP();

#endif