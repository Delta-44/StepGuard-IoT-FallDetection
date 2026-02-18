#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <vector>
#include "time.h"
#include "red.h"
#include "secrets.h"

//Ocultas
const char *ssid = WIFI_SSID;
const char *password = WIFI_PASS;

const char *mqtt_server = MQTT_SERVER;
const int mqtt_port = MQTT_PORT;
const char *mqtt_user = MQTT_USER;
const char *mqtt_pass = MQTT_PASS;

// Variables globales
String globalMac;
String mqtt_topic;
String status_topic;

WiFiClientSecure espClient;
PubSubClient client(espClient);

/// @brief Establecer conexión WiFi y configurar MQTT
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
    status_topic = "stepguard/status/" + globalMac; // Para heartbeat

    Serial.print("Tópico configurado: ");
    Serial.println(mqtt_topic);

    // Configuración SSL para HiveMQ Cloud
    espClient.setInsecure();

    configTime(3600, 0, "pool.ntp.org");
    client.setServer(mqtt_server, mqtt_port);

    // El broker esperará máximo 10s-15s antes de declarar al dispositivo "muerto"
    client.setKeepAlive(30);
}

/// @brief Reconectar al servidor MQTT si la conexión se pierde
void reconnect()
{
    while (!client.connected())
    {
        Serial.print("Intentando conexión MQTT segura...");
        String clientId = "StepGuard-" + globalMac; // MAC para el ID

        if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) // Último Will para indicar desconexión
        {
            Serial.println("conectado");
            client.publish(status_topic.c_str(), "online"); // Publicar estado online al conectar
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

/// @brief Reintentar conexión hasta que se establezca y mantiene el loop de MQTT activo
void loopReconnect()
{
    if (!client.connected())
    {
        reconnect();
    }
    client.loop();
}

/// @brief Enviar datos mediente MQTT en formato JSON
/// @param sos_presionado Si se envia por pulsar el boton SOS
/// @param caida_detectada Si se envia por detectar una caida
/// @param impactos Lista de las magnitudes de los impactos
void enviarReporteMQTT(bool sos_presionado, bool caida_detectada, const std::vector<float> &impactos)
{
    // Si no hay conexión intentamos reconectar una vez
    if (!client.connected())
        reconnect();

    // Si no conecta, cancelamos para evitar bloqueos
    if (!client.connected())
        return;

    // ! MUY IMPORTANTE: AJUSTAR EL TAMAÑO DEL JSON SEGÚN LOS DATOS QUE SE ESPEREN ENVIAR
    const size_t SIZE_JSON = 2048;
    DynamicJsonDocument doc(SIZE_JSON);

    // Datos para el JSON
    doc["mac"] = globalMac;
    doc["isButtonPressed"] = sos_presionado;
    doc["isFallDetected"] = caida_detectada;
    doc["timestamp"] = obtenerHoraNTP();

    JsonArray impactosJson = doc.createNestedArray("impact_magnitudes"); // Array para los impactos
    for (float f : impactos)
    {
        impactosJson.add(f);
    }

    doc["impact_count"] = impactos.size();

    char buffer[SIZE_JSON];     // Reservar espacio en memoria
    serializeJson(doc, buffer); // Convertir JSON a string para enviar

    // Publicar en MQTT
    if (client.publish(mqtt_topic.c_str(), buffer)) // necesitamos que mqtt_topic sea un C-string para publish
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

/// @brief Obtener la hora actual desde el servidor NTP
/// @return String con la hora formateada
String obtenerHoraNTP()
{
    struct tm timeinfo;

    if (!getLocalTime(&timeinfo)) // Si no se pudo obtener la hora
    {
        return "0000-00-00 00:00:00";
    }
    char buff[25];
    strftime(buff, sizeof(buff), "%Y-%m-%d %H:%M:%S", &timeinfo); // Formatear la hora
    return String(buff);                                          // Devolver como String de Arduino
}

void enviarHeartbeat()
{
    static unsigned long ultimoHeartbeat = 0;
    unsigned long ahora = millis();

    int segundos = 1000;

    // Enviamos el pulso cada 7 segundos
    if (ahora - ultimoHeartbeat >= segundos)
    {
        if (client.connected())
        {
            client.publish(status_topic.c_str(), "online");
            Serial.println("Heartbeat enviado"); // Para debug
        }
        ultimoHeartbeat = ahora;
    }
}