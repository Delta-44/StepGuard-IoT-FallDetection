#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>
#include "acelerometro.h"

// Configuración del acelerómetro
Adafruit_MPU6050 mpu;
float impactoMinimo = 50.0;
bool acelerometroDisponible = false; // Para revisar si esta conectado

/// @brief Revisar si el sensor está conectado y configurarlo
void setupAcelerometro() {
    if (!mpu.begin()) { // Si no se detecta el sensor
        Serial.println("[!] ADVERTENCIA: No se encuentra el sensor MPU6050.");
        Serial.println("[!] El sistema continuará funcionando solo con el botón SOS.");
        acelerometroDisponible = false; 
    } else {
        mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
        mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
        Serial.println("MPU6050 configurado correctamente.");
        acelerometroDisponible = true; 
    }
}

/// @brief Detectar si hay una caída basada en la magnitud del impacto
/// @return true si se detecta una caída, false si no
bool detectarCaida() {
    if (!acelerometroDisponible) {
        return false; // no puede haber caída si no hay sensor xd
    }
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    // Calcular la magnitud del impacto
    float magnitudAcc = sqrt(pow(a.acceleration.x, 2) + 
                             pow(a.acceleration.y, 2) + 
                             pow(a.acceleration.z, 2));

    // Ajustar impactoMinimo segun se necesite
    if (magnitudAcc > impactoMinimo) { 
        return true;
    }
    return false;
}

/// @brief Obtener la magnitud del impacto actual
/// @return Magnitud del impacto como float
float obtenerMagnitudImpacto() {
    if (!acelerometroDisponible) {
        return 0.0; // no puede haber magnitud si no hay sensor xd
    }
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    return sqrt(pow(a.acceleration.x, 2) + pow(a.acceleration.y, 2) + pow(a.acceleration.z, 2));
}