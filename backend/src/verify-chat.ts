import axios from 'axios';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
    id: 1,
    role: 'admin',
    nombre: 'Test Admin',
    email: 'test@admin.com'
};

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

// Generate a valid token for testing
const token = jwt.sign(TEST_USER, JWT_SECRET, { expiresIn: '1h' });

async function verifyChat() {
    console.log('--- Verifying AI Chat API ---');

    try {
        const response = await axios.post(
            `${BASE_URL}/chat`,
            { message: "holi, que puedes hacer?" },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Response Status:', response.status);
        console.log('AI Reply:', response.data.reply);
        
        if (response.data.reply && response.data.reply.length > 0) {
            console.log('✅ Chat API verification SUCCESS');
        } else {
            console.error('❌ Chat API verification FAILED: Empty response');
        }

    } catch (error: any) {
        console.error('❌ Chat API verification FAILED:', error.response?.data || error.message);
    }
}

// Run verify
verifyChat();
