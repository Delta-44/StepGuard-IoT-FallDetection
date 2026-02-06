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
            // console.log(`📩 MQTT Message received on ${topic}:`, payload); // Optional: reduce noise

            // 1. Check if it is a STATUS update
            // Topic format: stepguard/status/<macAddress>
            if (topic.startsWith('stepguard/status/')) {
                const macAddress = topic.split('/').pop();
                if (macAddress && payload.toLowerCase() === 'online') {
                    // Only register heartbeat for 'online' messages as requested
                    await ESP32Service.registerHeartbeat(macAddress);
                } else if (macAddress && payload.toLowerCase() === 'offline') {
                    // Start of manual offline (if needed, but Timeout handles it mainly)
                    // The user said "only receives online", but preserving 'offline' handling explicitly is safer
                    await ESP32Service.updateDeviceStatus(macAddress, 'offline');
                }
                return;
            }

            // 2. Otherwise treat as TELEMETRY
            // Topic format: stepguard/<macAddress> or similar
            // We ignore any 'status' field in the JSON payload for status updates needed
            try {
                const data = JSON.parse(payload);
                
                // Map 'mac' to 'macAddress' if needed, or use as is
                // We intentionally strip 'status' from the data passed to processTelemetry
                // to enforce that ONLY the dedicated topic controls status.
                const { mac, status, ...rest } = data; 
                
                const processedData = {
                    macAddress: mac || data.macAddress, // Support both
                    ...rest
                };
                
                // Delegate logic to the unified service
                await ESP32Service.processTelemetry(processedData);

            } catch (jsonError) {
                console.error('❌ Error parsing JSON telemetry:', jsonError);
            }
             
        } catch (error) {
            console.error('❌ Error processing MQTT message:', error);
        }
    });

    client.on('error', (err) => {
        console.error('❌ MQTT Connection Error:', err);
    });
};
