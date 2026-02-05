
import mqtt from 'mqtt';
import dotenv from 'dotenv';
dotenv.config();

async function triggerEvent() {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
  const options = {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      rejectUnauthorized: false
  };

  console.log(`🔌 Connecting to MQTT Broker: ${brokerUrl}...`);
  const client = mqtt.connect(brokerUrl, options);

  const mockMac = 'TEST:STREAM:00:11';
  const topic = `stepguard/${mockMac}`;
  
  const payload = JSON.stringify({
    macAddress: mockMac,
    status: true,
    isButtonPressed: true,
    isFallDetected: false,
    timestamp: new Date().toISOString(),
    impact_magnitude: 0,
    impact_count: 0
  });

  client.on('connect', () => {
    console.log('✅ Connected to MQTT. Publishing message...');
    
    client.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ Publish error:', err);
      } else {
        console.log(`📤 Message sent to ${topic}`);
      }
      client.end();
    });
  });

  client.on('error', (err) => {
    console.error('❌ MQTT Error:', err);
    client.end();
  });
}

triggerEvent();
