
import dotenv from 'dotenv';
import request from 'supertest';
import express from 'express';
import esp32Routes from './routes/esp32Routes';
import { ESP32Cache } from './config/redis';

// Mock Redis environment if needed, but here we use the real connection as per previous steps
dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/esp32', esp32Routes);

const testDevice = {
    deviceId: 'ESP32-TEST-001',
    temperature: 25.5,
    humidity: 60,
    isFallDetected: false,
    batteryLevel: 98
};

const runTest = async () => {
    console.log('--- Testing ESP32 Data Ingestion ---');

    try {
        // 1. Send Data
        console.log('Sending data to /api/esp32/data ...');
        const res = await request(app)
            .post('/api/esp32/data')
            .send(testDevice);

        if (res.status === 200) {
            console.log('✅ Data sent successfully');
        } else {
            console.error('❌ Failed to send data:', res.body);
            process.exit(1);
        }

        // 2. Verify Redis
        console.log('Verifying Redis storage...');
        // Wait a bit for Redis to be updated (although it should be near instant)
        await new Promise(r => setTimeout(r, 500));

        const cachedData = await ESP32Cache.getDeviceData(testDevice.deviceId);
        if (cachedData && cachedData.temperature === testDevice.temperature) {
            console.log('✅ Data retrieved from Redis matches!');
            console.log('Cached Data:', cachedData);
        } else {
            console.error('❌ Data mismatch or not found in Redis');
            console.error('Expected:', testDevice);
            console.error('Got:', cachedData);
            process.exit(1);
        }
        
        // 3. Clean up
         await ESP32Cache.clearDeviceData(testDevice.deviceId);
         console.log('✅ Test Data Cleaned up');

    } catch (error) {
        console.error('❌ Test Script Error:', error);
    } finally {
        process.exit(0);
    }
};

runTest();
