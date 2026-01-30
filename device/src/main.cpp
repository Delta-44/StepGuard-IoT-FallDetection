#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>
#include <ArduinoJson.h>

// ------- ARCHIVO ESQUELETO ECHO POR GOOGLE AI STUDIO -------

// --- Configuración de Red ---
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// --- Configuración de API ---
const char* serverName = "http://tu-api-url.com/api/alerts"; 
String deviceToken = "ESP32_UNIT_01"; // Identificador de este dispositivo

// --- Objetos y Variables Globales ---
Adafruit_MPU6050 mpu;
unsigned long lastTime = 0;
unsigned long timerDelay = 5000; // Tiempo entre lecturas si no hay caída

// --- Prototipos de Funciones ---
void connectWiFi();
void checkFallDetection();
void sendAlert(float magnitude);

void setup() {
  Serial.begin(115200);
  
  // 1. Inicializar Sensor
  if (!mpu.begin()) {
    Serial.println("Error: No se encuentra el sensor MPU6050");
    while (1) yield();
  }
  Serial.println("MPU6050 conectado.");

  // 2. Conectar a WiFi
  connectWiFi();
}

void loop() {
  // Solo intentamos detectar si estamos conectados
  if (WiFi.status() == WL_CONNECTED) {
    checkFallDetection();
  } else {
    connectWiFi();
  }
  delay(10); // Pequeña pausa para estabilidad
}

// --- Lógica de Conexión ---
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  
  Serial.print("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado con éxito.");
}

// --- Lógica de Detección (Simplificada) ---
void checkFallDetection() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Calcular la magnitud total de la aceleración (Vector Magnitude)
  // Magnitud = sqrt(ax^2 + ay^2 + az^2)
  float rawMagnitude = sqrt(pow(a.acceleration.x, 2) + 
                            pow(a.acceleration.y, 2) + 
                            pow(a.acceleration.z, 2));

  // El valor de la gravedad en reposo es aprox 9.8 m/s^2
  // Un impacto suele superar los 25-30 m/s^2 (ajustar según pruebas)
  if (rawMagnitude > 30.0) { 
    Serial.println("¡CAÍDA DETECTADA!");
    sendAlert(rawMagnitude);
    delay(2000); // Evitar alertas repetidas en el mismo segundo
  }
}

// --- Comunicación con Backend ---
void sendAlert(float magnitude) {
  HTTPClient http;

  // Iniciar conexión con el endpoint
  http.begin(serverName);
  http.addHeader("Content-Type", "application/json");

  // Crear el objeto JSON
  StaticJsonDocument<200> doc;
  doc["device_id"] = deviceToken;
  doc["alert_type"] = "fall";
  doc["intensity"] = magnitude;
  doc["timestamp"] = "null"; // El backend suele asignar el tiempo, o usa un servidor NTP

  String requestBody;
  serializeJson(doc, requestBody);

  // Enviar POST
  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    Serial.print("Respuesta del servidor: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("Error enviando POST: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}