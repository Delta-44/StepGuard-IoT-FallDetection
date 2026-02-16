import mqtt from 'mqtt';
import dotenv from 'dotenv';
import { ESP32Service } from '../services/esp32Service';

dotenv.config();

const mqttOptions: mqtt.IClientOptions = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    protocol: 'mqtts', // MQTT Seguro
    port: 8883,
};

const brokerUrl = process.env.MQTT_BROKER_URL || '';

export const connectMQTT = () => {
    if (!brokerUrl) {
        console.error('MQTT Broker URL wrong env configuration');
        return;
    }

    console.log('Conectando al Broker MQTT:', brokerUrl);

    const client = mqtt.connect(brokerUrl, mqttOptions);

    client.on('connect', () => {
        console.log(`Conectado al Broker MQTT: ${brokerUrl}`);

        // Suscribirse a stepguard/# según lo solicitado
        client.subscribe('stepguard/#', (err) => {
            if (err) {
                console.error('Error de Suscripción MQTT:', err);
            } else {
                console.log('Suscrito al tema: stepguard/#');
            }
        });
    });

    client.on('message', async (topic, message) => {
        try {
            const payload = message.toString();


            // 1. Actualización de estado (stepguard/status/<macAddress>)
            if (topic.startsWith('stepguard/status/')) {
                const macAddress = topic.split('/').pop();
                if (macAddress && payload.toLowerCase() === 'online') {
                    // Solo registrar latido para mensajes 'online' como se solicitó
                    await ESP32Service.registerHeartbeat(macAddress);
                } else if (macAddress && payload.toLowerCase() === 'offline') {
                    await ESP32Service.updateDeviceStatus(macAddress, 'offline');
                }
                return;
            }

            // 2. Telemetría (stepguard/<macAddress>)
            // Ignoramos cualquier campo 'status' en la carga útil JSON para actualizaciones de estado necesarias
            try {
                const data = JSON.parse(payload);

                // Eliminar 'status' de los datos para asegurar que SOLO el tema dedicado controle el estado
                const { mac, status, ...rest } = data;

                const processedData = {
                    macAddress: mac || data.macAddress, // Soportar ambos
                    ...rest
                };

                // Delegar lógica al servicio unificado
                await ESP32Service.processTelemetry(processedData);

            } catch (jsonError) {
                console.error('Error analizando telemetría JSON:', jsonError);
            }

        } catch (error) {
            console.error('Error procesando mensaje MQTT:', error);
        }
    });

    client.on('error', (err) => {
        console.error('Error de Conexión MQTT:', err);
    });
};
