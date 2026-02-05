#include <Arduino.h>
#include <WiFi.h>
#include <vector>
#include "boton.h"
#include "inclinacion.h"
#include "acelerometro.h"
#include "red.h"

std::vector<float> listaImpactos;

// --- Variables para el temporizador ---
unsigned long tiempoUltimoReporte = 0;
const unsigned long INTERVALO_REPORTE = 120000; // 120,000 ms = 2 minutos

void setup()
{
    Serial.begin(115200);
    setupRed();
    setupBoton();
    setupInclinacion();
    setupAcelerometro();
    Serial.println("StepGuard: Sistema iniciado.");
    
    tiempoUltimoReporte = millis(); // Inicializar el tiempo
}

void loop()
{
    loopRed(); 

    // 1. SOS MANUAL (Envío inmediato)
    if (verificarBotonSOS())
    {
        Serial.println("[!] SOS pulsado. Informando...");
        enviarReporteMQTT(true, false, listaImpactos);
        listaImpactos.clear();
        tiempoUltimoReporte = millis(); // Reiniciamos el cronómetro de 2 min
    }

    // 2. LÓGICA DE CAÍDA (Envío inmediato si se confirma)
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
            tiempoUltimoReporte = millis(); // Reiniciamos el cronómetro de 2 min
        }
    }

    // 3. REPORTE AUTOMÁTICO CADA 2 MINUTOS (Heartbeat)
    // Se envía aunque no haya caídas ni SOS
    if (millis() - tiempoUltimoReporte >= INTERVALO_REPORTE)
    {
        Serial.println("[i] Enviando reporte periódico de estado...");
        // Enviamos: SOS=false, Caída=false
        // Si hubo impactos pero no llegaron a ser caída, se enviarán aquí
        enviarReporteMQTT(false, false, listaImpactos);
        
        listaImpactos.clear(); // Limpiamos después de enviar el resumen
        tiempoUltimoReporte = millis(); // Actualizar tiempo
    }

    // 4. SEÑALIZACIÓN LOCAL
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