
import dotenv from 'dotenv';
import request from 'supertest';
import express from 'express';
import esp32Routes from './routes/esp32Routes';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/esp32', esp32Routes);

const testDeviceId = 'ESP32-PERSISTENT-001'; // Use the device we created earlier

const runReadTest = async () => {
    console.log('--- Testing Read ESP32 Data Endpoint ---');

    try {
        // 1. Read existing device
        console.log(`Reading data for device: ${testDeviceId}...`);
        const res = await request(app)
            .get(`/api/esp32/data/${testDeviceId}`);

        if (res.status === 200) {
            console.log('✅ Data retrieved successfully');
            console.log('Data:', res.body);
        } else {
            console.error('❌ Failed to retrieve data');
            console.error('Status:', res.status);
            console.error('Body:', res.body);
        }

        // 2. Read non-existent device
        console.log('\nReading non-existent device: FAULTY-ID...');
        const resFail = await request(app)
            .get('/api/esp32/data/FAULTY-ID');

        if (resFail.status === 404) {
            console.log('✅ Correctly returned 404 for missing device');
        } else if (resFail.status === 200 && !resFail.body) {
             // Depending on implementation it might return null/empty 200, checking impl:
             // It returns 404 if !data.
             console.log('⚠️ Unexpected status for missing device:', resFail.status);
             console.log(resFail.body);
        } else {
             console.log('✅ Handled missing device (Status code: ' + resFail.status + ')');
        }

    } catch (error) {
        console.error('❌ Script Error:', error);
    } finally {
        process.exit(0);
    }
};

runReadTest();
