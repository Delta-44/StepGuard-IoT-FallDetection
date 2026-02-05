#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>
#include "acelerometro.h"

Adafruit_MPU6050 mpu;

void setupAcelerometro() {
    if (!mpu.begin()) {
        Serial.println("Error: No se encuentra el sensor MPU6050");
        while (1) yield();
    }
    // Configuración para detección de impactos (rango alto)
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("MPU6050 configurado correctamente.");
}

bool detectarCaida() {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    float magnitudAcc = sqrt(pow(a.acceleration.x, 2) + 
                             pow(a.acceleration.y, 2) + 
                             pow(a.acceleration.z, 2));

    // Umbral de test (Ajustable)
    if (magnitudAcc > 20.0) { 
        return true;
    }
    return false;
}

float obtenerMagnitudImpacto() {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    return sqrt(pow(a.acceleration.x, 2) + pow(a.acceleration.y, 2) + pow(a.acceleration.z, 2));
}