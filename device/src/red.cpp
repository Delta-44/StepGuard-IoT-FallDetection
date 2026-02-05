#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <vector>
#include "time.h"
#include "red.h"

// Credenciales WiFi
const char *ssid = "Argulles";
const char *password = "sexoenelsaxo";

// Configuración MQTT HiveMQ Cloud
const char *mqtt_server = "a54daced88d04e29b3ea4910a02d45ba.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char *mqtt_user = "stepguard";
const char *mqtt_pass = "Stepguard123";

// Variables globales que se llenarán en setupRed
String globalMac;
String mqtt_topic;

WiFiClientSecure espClient;
PubSubClient client(espClient);

void reconnect()
{
    while (!client.connected())
    {
        Serial.print("Intentando conexión MQTT segura...");
        // Usamos la MAC para el ID de cliente
        String clientId = "StepGuard-" + globalMac;
        
        if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass))
        {
            Serial.println("conectado");
        }
        else
        {
            Serial.print("falló, rc=");
            Serial.print(client.state());
            Serial.println(" intentando de nuevo en 5 segundos");
            delay(5000);
        }
    }
}

void setupRed()
{
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi OK");

    // Una vez conectado, obtenemos la MAC con seguridad
    globalMac = WiFi.macAddress();
    mqtt_topic = "stepguard/" + globalMac;
    
    Serial.print("Tópico configurado: ");
    Serial.println(mqtt_topic);

    // Configuración SSL para HiveMQ Cloud
    espClient.setInsecure(); 

    configTime(3600, 0, "pool.ntp.org");
    client.setServer(mqtt_server, mqtt_port);
}

void loopRed()
{
    if (!client.connected())
    {
        reconnect();
    }
    client.loop();
}

void enviarReporteMQTT(bool sos_presionado, bool caida_detectada, const std::vector<float>& impactos)
{
    if (!client.connected())
        reconnect();

    // 1024 bytes es suficiente para unos 15-20 impactos. 
    // Si esperas muchos más, sube a 2048.
    DynamicJsonDocument doc(1024); 
    
    doc["mac"] = globalMac;
    doc["status"] = true;
    doc["isButtonPressed"] = sos_presionado;
    doc["isFallDetected"] = caida_detectada;
    doc["timestamp"] = obtenerHoraNTP();

    JsonArray impactosJson = doc.createNestedArray("impact_magnitudes");
    for (float f : impactos) {
        impactosJson.add(f);
    }
    
    doc["impact_count"] = impactos.size();

    char buffer[1024];
    serializeJson(doc, buffer);

    // IMPORTANTE: mqtt_topic es String, usamos .c_str() para el publish
    if (client.publish(mqtt_topic.c_str(), buffer))
    {
        Serial.print("JSON Enviado a ");
        Serial.println(mqtt_topic);
        Serial.println(buffer);
    }
    else
    {
        Serial.println("Error al publicar en MQTT");
    }
}

String obtenerHoraNTP()
{
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo))
    {
        return "0000-00-00 00:00:00";
    }
    char buff[25];
    strftime(buff, sizeof(buff), "%Y-%m-%d %H:%M:%S", &timeinfo);
    return String(buff);
}