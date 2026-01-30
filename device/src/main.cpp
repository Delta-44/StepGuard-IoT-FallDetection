#include <Arduino.h>

const int PIR_PIN = 13;
const int LED_PIN = 2;

unsigned long tiempoAnterior = 0;
const long intervalo = 500; // 1000 milisegundos = 1 segundo

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);

  Serial.println("\n--- STEPGUARD: MONITOR DE ACTIVIDAD ---");
  Serial.println("Calibrando sensor (espera 10 segundos)...");
  
  // Parpadeo rápido durante calibración
  for(int i = 0; i < 10; i++) {
    digitalWrite(LED_PIN, HIGH); delay(100);
    digitalWrite(LED_PIN, LOW);  delay(900);
    Serial.print(".");
  }
  
  Serial.println("\n¡SISTEMA ACTIVO! Reportando cada 0.5s...");
}

void loop() {
  // Leemos el sensor en cada instante
  int lectura = digitalRead(PIR_PIN);
  
  // El LED azul refleja el sensor en tiempo real (para feedback visual)
  digitalWrite(LED_PIN, lectura);

  // Lógica de reporte cada 0.5 segundos (sin detener el programa)
  unsigned long tiempoActual = millis();
  
  if (tiempoActual - tiempoAnterior >= intervalo) {
    tiempoAnterior = tiempoActual;

    if (lectura == HIGH) {
      Serial.println("[!] ESTADO: MOVIMIENTO");
    } else {
      Serial.println("[.] ESTADO: QUIETO");
    }
  }
}