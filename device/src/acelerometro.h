#ifndef ACELEROMETRO_H
#define ACELEROMETRO_H

void setupAcelerometro();
bool detectarCaida(); // Retorna true si detecta un impacto fuerte
float obtenerMagnitudImpacto();

#endif