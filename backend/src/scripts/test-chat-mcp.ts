import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const API_URL = 'http://localhost:3000/api/chat';

// Generate a test token
const token = jwt.sign(
    { id: 999, role: 'admin', email: 'test@admin.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
);

async function testChat() {
    try {
        console.log('Testing Chat with MCP...');
        console.log('Query: "Lista todos los dispositivos registrados"');

        const response = await axios.post(
            API_URL,
            { message: 'Lista todos los dispositivos registrados' },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Response:', response.data);

        console.log('\nTesting Chat with MCP telemetry...');
        console.log('Query: "Dime la telemetria del dispositivo AA:BB:CC:DD:EE:FF"');
         const response2 = await axios.post(
            API_URL,
            { message: "Dime la telemetria del dispositivo AA:BB:CC:DD:EE:FF" },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Response 2:', response2.data);


    } catch (error: any) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testChat();
