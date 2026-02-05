import mqtt from 'mqtt';
import dotenv from 'dotenv';
import { ESP32Service } from '../services/esp32Service';

dotenv.config();

const mqttOptions: mqtt.IClientOptions = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    protocol: 'mqtts', // Secure MQTT
    port: 8883,
};

const brokerUrl = process.env.MQTT_BROKER_URL || '';

export const connectMQTT = () => {
    if (!brokerUrl) {
        console.error('❌ MQTT Broker URL wrong env configuration');
        return;
    }

    console.log('🔄 Connecting to MQTT Broker:', brokerUrl);
    
    const client = mqtt.connect(brokerUrl, mqttOptions);

    client.on('connect', () => {
        console.log(`✅ Connected to MQTT Broker: ${brokerUrl}`);
        
        // Subscribe to stepguard/# as requested
        client.subscribe('stepguard/#', (err) => {
            if (err) {
                console.error('❌ MQTT Subscribe Error:', err);
            } else {
                console.log('📡 Subscribed to topic: stepguard/#');
            }
        });
    });

    client.on('message', async (topic, message) => {
        try {
            const payload = message.toString();
            console.log(`📩 MQTT Message received on ${topic}:`, payload);
            
            const data = JSON.parse(payload);
            
            // Map 'mac' to 'macAddress' if needed, or use as is
            const { mac, ...rest } = data;
            const processedData = {
                macAddress: mac || data.macAddress, // Support both
                ...rest
            };
            
            // Delegate logic to the unified service
            await ESP32Service.processTelemetry(processedData);
             
        } catch (error) {
            console.error('❌ Error processing MQTT message:', error);
        }
    });

    client.on('error', (err) => {
        console.error('❌ MQTT Connection Error:', err);
    });
};
