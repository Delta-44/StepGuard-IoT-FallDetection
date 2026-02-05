
import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const MOCK_EVENT_ID = 5; // Change this to a valid ID from previous tests if needed

// Generate Token
const adminToken = jwt.sign({ id: 1, role: 'admin', nombre: 'AdminVerify' }, JWT_SECRET);

function listenForResolution() {
    console.log(`🎧 Admin Listening for Updates...`);
    const req = http.request(`http://localhost:3000/api/alerts/stream?token=${adminToken}`, (res) => {
        res.on('data', (chunk) => {
            const msg = chunk.toString();
            if (msg.trim().includes('Connected')) return;
            if (msg.trim()) {
                console.log(`📩 RECEIVED UPDATE:`, msg);
            }
        });
    });
    req.end();
}

async function resolveEvent() {
    console.log(`🛠️ Marking event ${MOCK_EVENT_ID} as resolved...`);
    
    try {
        const response = await axios.put(
            `http://localhost:3000/api/events/${MOCK_EVENT_ID}/resolve`,
            {},
            { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('✅ Response:', response.data);
    } catch (error: any) {
        console.error('❌ Error resolving:', error.response?.data || error.message);
    }
}

listenForResolution();

setTimeout(() => {
    resolveEvent();
}, 2000);
