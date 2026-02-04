
import dotenv from 'dotenv';
import request from 'supertest';
import express from 'express';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import { UsuarioModel } from './models/usuario';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const testUserEmail = 'juan.perez@example.com'; 
const testUserPassword = 'usuario123';

const runTests = async () => {
    console.log('--- Testing User Endpoint with Device Info ---');

    try {
        // 1. Login to get a token
        console.log(`\n1. Logging in as ${testUserEmail}...`);
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: testUserEmail, password: testUserPassword });

        if (loginRes.status !== 200) {
            console.error('❌ Login Failed:', loginRes.body);
            process.exit(1);
        }

        const token = loginRes.body.token;
        const userId = loginRes.body.user.id;
        console.log('✅ Login Successful');
        console.log('Token:', token ? 'Recieved' : 'Missing');
        console.log('User ID:', userId);

        // 2. Fetch User Details
        console.log(`\n2. Fetching details for user ID ${userId} (GET /api/users/${userId})...`);
        const userRes = await request(app)
            .get(`/api/users/${userId}`)
            .set('Authorization', `Bearer ${token}`);

        if (userRes.status === 200) {
            console.log('✅ User Details Retrieved');
            console.log('User Name:', userRes.body.nombre);
            
            if (userRes.body.dispositivo) {
                console.log('✅ Device Info Present:');
                console.log('   - Device ID:', userRes.body.dispositivo.device_id);
                console.log('   - Name:', userRes.body.dispositivo.nombre);
                console.log('   - Status:', userRes.body.dispositivo.estado);
            } else {
                console.log('⚠️ No Device Info found (User might not have a device assigned)');
            }
        } else {
            console.error('❌ Failed to retrieve user details:', userRes.body);
        }

    } catch (error) {
        console.error('❌ Test Script Error:', error);
    } finally {
        // Force exit to ensure script terminates even if DB connection hangs
        process.exit(0);
    }
};

runTests();
