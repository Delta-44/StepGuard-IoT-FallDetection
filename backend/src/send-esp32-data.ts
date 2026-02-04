
import dotenv from 'dotenv';
import request from 'supertest';
import express from 'express';
import esp32Routes from './routes/esp32Routes';
import { ESP32Cache } from './config/redis';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/esp32', esp32Routes);

const persistentDevice = {
    deviceId: 'AAAAAAAAAAA',
    temperature: 28.4,
    humidity: 55,
    isFallDetected: false,
    batteryLevel: 92,
    timestamp: new Date().toISOString()
};

const sendPersistentData = async () => {
    console.log('--- Sending Persistent ESP32 Data ---');

    try {
        console.log(`Sending data for device: ${persistentDevice.deviceId}`);
        const res = await request(app)
            .post('/api/esp32/data')
            .send(persistentDevice);

        if (res.status === 200) {
            console.log('✅ Data sent successfully');
            console.log('---------------------------------------------------');
            console.log('⚠️  THIS DATA HAS BEEN SAVED TO REDIS.');
            console.log(`    Key: device:${persistentDevice.deviceId}`);
            console.log('    You can check your Redis Cloud instance.');
            console.log('---------------------------------------------------');
            
            // Verify it's there immediately
            const cachedData = await ESP32Cache.getDeviceData(persistentDevice.deviceId);
            console.log('Saved Data:', cachedData);
            
        } else {
            console.error('❌ Failed to send data:', res.body);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Script Error:', error);
    } finally {
        process.exit(0);
    }
};

sendPersistentData();
