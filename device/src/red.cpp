#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "time.h"
#include "red.h"

// Credenciales WiFi
const char* ssid = "Argulles";
const char* password = "sexoenelsaxo";

// Configuración MQTT
const char* mqtt_server = "broker.hivemq.com"; 
const int mqtt_port = 1883;
const char* mqtt_topic = "stepguard/alerts"; // El tópico donde el backend escuchará

WiFiClient espClient;
PubSubClient client(espClient);

void reconnect() {
    while (!client.connected()) {
        Serial.print("Intentando conexión MQTT...");
        // Creamos un ID de cliente único usando la MAC
        String clientId = "StepGuard-" + WiFi.macAddress();
        if (client.connect(clientId.c_str())) {
            Serial.println("conectado");
        } else {
            Serial.print("falló, rc=");
            Serial.print(client.state());
            Serial.println(" intentando de nuevo en 5 segundos");
            delay(5000);
        }
    }
}

void setupRed() {
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
    Serial.println("\nWiFi OK");

    configTime(-18000, 0, "pool.ntp.org"); 

    client.setServer(mqtt_server, mqtt_port);
}

void loopRed() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop(); // Mantiene la comunicación con el broker
}

void enviarReporteMQTT(int contador, float fuerza) {
    if (!client.connected()) reconnect();

    StaticJsonDocument<256> doc;
    doc["mac"] = WiFi.macAddress();
    doc["impact_count"] = contador;
    doc["magnitude"] = fuerza;
    doc["timestamp"] = obtenerHoraNTP();

    char buffer[256];
    serializeJson(doc, buffer);

    if (client.publish(mqtt_topic, buffer)) {
        Serial.println("Mensaje enviado por MQTT: ");
        Serial.println(buffer);
    } else {
        Serial.println("Error al enviar por MQTT");
    }
}

String obtenerHoraNTP() {
    struct tm timeinfo;
    if(!getLocalTime(&timeinfo)) return "0000-00-00 00:00:00";
    char buff[20];
    strftime(buff, sizeof(buff), "%Y-%m-%d %H:%M:%S", &timeinfo);
    return String(buff);
}