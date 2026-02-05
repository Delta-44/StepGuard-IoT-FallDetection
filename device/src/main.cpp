#include <Arduino.h>
#include "boton.h"
#include "inclinacion.h"
#include "acelerometro.h"
#include "red.h"
#include <WiFi.h> 

int totalImpactos = 0;

void setup() {
    Serial.begin(115200);
    
    setupRed();         // Iniciar WiFi y NTP
    setupBoton();       // D14
    setupInclinacion(); // D32, D33
    setupAcelerometro(); // D21, D22 (I2C)

    Serial.println("StepGuard: Sistema iniciado y conectado.");
    Serial.print("ID Dispositivo (MAC): ");
    Serial.println(WiFi.macAddress());
}

void loop() {
    // 1. SOS MANUAL (Envía reporte con fuerza 0)
    if (verificarBotonSOS()) {
        Serial.println("[!] SOS pulsado. Informando...");
        enviarReporteMQTT(totalImpactos, 0.0);
    }

    // 2. LÓGICA DE CAÍDA (Acelerómetro + Inclinación)
    if (detectarCaida()) {
        float magnitud = obtenerMagnitudImpacto(); // Necesitas crear esta función en tu módulo acelerometro
        totalImpactos++;
        
        Serial.printf("Impacto detectado: %.2f m/s2. Total: %d\n", magnitud, totalImpactos);
        
        delay(1500); // Pequeña espera para confirmar posición final

        if (estaInclinado()) {
            Serial.println(">>> ALERTA: CAÍDA CONFIRMADA. Enviando JSON...");
            enviarReporteMQTT(totalImpactos, magnitud);
        }
    }

    // 3. SEÑALIZACIÓN LOCAL
    if (estaInclinado()) {
        parpadearLedInclinacion();
    } else {
        controlarLedInclinacion(false);
    }

    delay(10);
}