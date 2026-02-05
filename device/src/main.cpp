#include <Arduino.h>
#include <WiFi.h>
#include <vector>
#include "boton.h"
#include "inclinacion.h"
#include "acelerometro.h"
#include "red.h"

// Array para almacenar las magnitudes de los impactos
std::vector<float> listaImpactos;

// Variables para el temporizador
unsigned long tiempoUltimoReporte = 0;
const unsigned long INTERVALO_REPORTE = 120000;

// Inicializacion general
void setup()
{
    Serial.begin(115200);
    setupRed();
    setupBoton();
    setupInclinacion();
    setupAcelerometro();
    Serial.println("StepGuard: Sistema iniciado.");

    // Guardar el tiempo de inicio
    tiempoUltimoReporte = millis();
}

// Loop principal
void loop()
{
    loopReconnect();

    // Logica de boton SOS
    if (verificarBotonSOS())
    {
        Serial.println("[!] SOS pulsado. Informando...");
        enviarReporteMQTT(true, false, listaImpactos);
        listaImpactos.clear();

        tiempoUltimoReporte = millis(); // Guardamos el tiempo del ultimo reporte
    }

    // Logica de caida 
    if (detectarCaida())
    {
        float fuerzaImpacto = obtenerMagnitudImpacto();
        listaImpactos.push_back(fuerzaImpacto);

        Serial.printf("Impacto registrado: %.2f m/s2. Acumulados: %d\n", fuerzaImpacto, listaImpactos.size());

        delay(1500); // Pequeña espera para confirmar inclinación

        if (estaInclinado())
        {
            Serial.println(">>> ALERTA: CAÍDA CONFIRMADA.");
            enviarReporteMQTT(false, true, listaImpactos);
            listaImpactos.clear();

            tiempoUltimoReporte = millis(); // Guardamos el tiempo del ultimo reporte
        }
    }

    // Reporte automatico, cambiar INTERVALO_REPORTE para ajustar frecuencia 
    if (millis() - tiempoUltimoReporte >= INTERVALO_REPORTE)
    {
        Serial.println("[i] Enviando reporte periódico de estado...");
        enviarReporteMQTT(false, false, listaImpactos);

        listaImpactos.clear();          // Limpiamos los impactos
        tiempoUltimoReporte = millis(); // Guardamos el tiempo del ultimo reporte
    }

    // Activar el led de inclinacion
    if (estaInclinado())
    {
        parpadearLedInclinacion();
    }
    else
    {
        controlarLedInclinacion(false);
    }

    delay(10);
}