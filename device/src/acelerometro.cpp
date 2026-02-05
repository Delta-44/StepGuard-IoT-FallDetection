#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>
#include "acelerometro.h"

Adafruit_MPU6050 mpu;
float impactoMinimo = 50.0;
bool acelerometroDisponible = false;

void setupAcelerometro() {
    if (!mpu.begin()) {
        Serial.println("[!] ADVERTENCIA: No se encuentra el sensor MPU6050.");
        Serial.println("[!] El sistema continuará funcionando solo con el botón SOS.");
        acelerometroDisponible = false; // Marcamos como no disponible
    } else {
        // Configuración si el sensor sí existe
        mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
        mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
        Serial.println("MPU6050 configurado correctamente.");
        acelerometroDisponible = true; // Marcamos como disponible
    }
}

bool detectarCaida() {
    if (!acelerometroDisponible) {
        return false; 
    }
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    float magnitudAcc = sqrt(pow(a.acceleration.x, 2) + 
                             pow(a.acceleration.y, 2) + 
                             pow(a.acceleration.z, 2));

    // Umbral de test (Ajustable)
    if (magnitudAcc > impactoMinimo) { 
        return true;
    }
    return false;
}

float obtenerMagnitudImpacto() {
    if (!acelerometroDisponible) {
        return 0.0; 
    }
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    return sqrt(pow(a.acceleration.x, 2) + pow(a.acceleration.y, 2) + pow(a.acceleration.z, 2));
}