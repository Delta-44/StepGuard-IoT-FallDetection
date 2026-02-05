
import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';
import mqtt from 'mqtt';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Mock Data
const MOCK_DEVICE_MAC = 'TEST:TARGET:00:01';
const OWNER_ID = 999;
const CAREGIVER_ID = 888;
const STRANGER_ID = 777;

// Generate Tokens
const ownerToken = jwt.sign({ id: OWNER_ID, role: 'usuario', nombre: 'Owner' }, JWT_SECRET);
const caregiverToken = jwt.sign({ id: CAREGIVER_ID, role: 'cuidador', nombre: 'Caregiver' }, JWT_SECRET);
const strangerToken = jwt.sign({ id: STRANGER_ID, role: 'usuario', nombre: 'Stranger' }, JWT_SECRET);

function connectClient(name: string, token: string) {
    console.log(`🎧 ${name} Connecting...`);
    const req = http.request(`http://localhost:3000/api/alerts/stream?token=${token}`, (res) => {
        if (res.statusCode !== 200) {
            console.log(`❌ ${name} Failed to connect: ${res.statusCode}`);
            return;
        }
        console.log(`✅ ${name} Connected!`);

        res.on('data', (chunk) => {
            const msg = chunk.toString();
            if (msg.trim().includes('Connected')) return; // Ignore initial message
            if (msg.trim()) {
                console.log(`📩 ${name} RECEIVED ALERT:`, msg);
            }
        });
    });
    req.end();
}

async function triggerEvent() {
    // 1. We need to actually INSERT this mock device and user into the DB so the server logic finds them.
    // However, for this quick test, we rely on the server having the logic.
    // The server queries the DB. If these IDs don't exist in DB, the filter will block everything!
    // So we CANNOT just use random IDs unless we mock the DB calls or insert data.
    
    // STRATEGY CHANGE: 
    // Instead of inserting complex data, I will use the EXISTING device 'TEST:STREAM:00:11' 
    // and see if I can get an alert. 
    // Since 'TEST:STREAM:00:11' was auto-created, it likely has NO owner.
    // So nobody should see it except maybe Admin.
    
    // Let's rely on the logs printed by the server: "Target Audience: User X..."
    // I will trigger an event for a NEW device, connect an ADMIN client, and verify Admin receives it.
    // Verifying specific user logic requires DB Setup which is heavy. 
    // I will test "Admin receives all" and "Stranger receives nothing" if possible.
    
    const adminToken = jwt.sign({ id: 1, role: 'admin', nombre: 'Admin' }, JWT_SECRET);
    connectClient('ADMIN', adminToken);
    
    setTimeout(() => {
        const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
        const client = mqtt.connect(brokerUrl, {
             username: process.env.MQTT_USERNAME,
             password: process.env.MQTT_PASSWORD,
             rejectUnauthorized: false
        });
        
        const topic = `stepguard/${MOCK_DEVICE_MAC}`;
        const payload = JSON.stringify({
            macAddress: MOCK_DEVICE_MAC,
            status: true,
            isButtonPressed: true,
            isFallDetected: false,
            timestamp: new Date().toISOString()
        });
        
        client.on('connect', () => {
            console.log('🚀 Triggering MQTT Event...');
            client.publish(topic, payload);
            client.end();
        });
    }, 2000);
}

triggerEvent();
