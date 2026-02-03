
import dotenv from 'dotenv';
import request from 'supertest';
import express from 'express';
import authRoutes from './routes/authRoutes';
import { UsuarioModel } from './models/usuario';
import { CuidadorModel } from './models/cuidador';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const testUser = {
  email: `user_${Date.now()}@test.com`,
  password: 'password123',
  name: 'Test User',
  edad: 30
};

const testCaregiver = {
  email: `caregiver_${Date.now()}@test.com`,
  password: 'password123',
  name: 'Test Caregiver',
  telefono: '123456789'
};

const runTests = async () => {
    console.log('--- Testing Unified Auth & Separate Registration ---');

    try {
        // 1. Register User (New Endpoint)
        console.log('\n1. Registering User (POST /register/usuario)...');
        const regUserRes = await request(app)
            .post('/api/auth/register/usuario')
            .send(testUser);
        
        if (regUserRes.status === 201) {
             console.log('✅ User Registered');
             console.log('User ID:', regUserRes.body.user.id);
             console.log('User Email:', regUserRes.body.user.email);
             if (regUserRes.body.user.role === 'usuario') {
                 console.log('✅ Role is correct:', regUserRes.body.user.role);
             } else {
                 console.error('❌ User Role Incorrect:', regUserRes.body.user.role);
             }
        } else {
             console.error('❌ User Registration Failed:', regUserRes.body);
        }

        // Check if user exists immediately via Model
        const checkUser = await UsuarioModel.findByEmail(testUser.email);
        console.log('DEBUG CHECK - User in DB:', !!checkUser);

        // 2. Register Caregiver (New Endpoint)
        console.log('\n2. Registering Caregiver (POST /register/cuidador)...');
        const regCareRes = await request(app)
            .post('/api/auth/register/cuidador')
            .send(testCaregiver);

        if (regCareRes.status === 201) {
            console.log('✅ Caregiver Registered');
             if (regCareRes.body.user.role === 'cuidador') {
                 console.log('✅ Role is correct:', regCareRes.body.user.role);
             } else {
                 console.error('❌ Caregiver Role Incorrect:', regCareRes.body.user.role);
             }
        } else {
            console.error('❌ Caregiver Registration Failed:', regCareRes.body);
        }

        // 3. Login as User (Unified Endpoint)
        console.log('\n3. Login as User...');
        const loginUserRes = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password });

        if (loginUserRes.status === 200) {
            console.log('✅ User Logic Successful');
            console.log('Returned Role:', loginUserRes.body.user.role);
            if (loginUserRes.body.user.role !== 'usuario') console.error('❌ Wrong Role returned!');
        } else {
            console.error('❌ User Login Failed:', loginUserRes.body);
        }

        // 4. Login as Caregiver (Unified Endpoint)
        console.log('\n4. Login as Caregiver...');
        const loginCareRes = await request(app)
            .post('/api/auth/login')
            .send({ email: testCaregiver.email, password: testCaregiver.password });

        if (loginCareRes.status === 200) {
            console.log('✅ Caregiver Login Successful');
            console.log('Returned Role:', loginCareRes.body.user.role);
            if (loginCareRes.body.user.role !== 'cuidador') console.error('❌ Wrong Role returned!');
        } else {
            console.error('❌ Caregiver Login Failed:', loginCareRes.body);
        }

        // Cleanup
        console.log('\nCleaning up...');
        if (regUserRes.body.user?.id) await UsuarioModel.delete(regUserRes.body.user.id);
        if (regCareRes.body.user?.id) await CuidadorModel.delete(regCareRes.body.user.id);
        console.log('✅ Cleanup Done');

    } catch (error) {
        console.error('❌ Test Script Error:', error);
    } finally {
        process.exit(0);
    }
};

runTests();
