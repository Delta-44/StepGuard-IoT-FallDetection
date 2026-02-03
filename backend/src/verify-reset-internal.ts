import { forgotPassword, resetPassword } from './controllers/authController';
import { UsuarioModel } from './models/usuario';
import pool from './config/database';
import { Request, Response } from 'express';

// Mock Express objects
const mockRequest = (body: any) => ({ body } as Request);
const mockResponse = () => {
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.data = data;
    return res;
  };
  return res as Response;
};

async function runTest() {
  console.log('🧪 Starting Internal Verification...');

  const testEmail = 'internal-test@example.com';
  
  try {
    // 0. Cleanup
    await pool.query('DELETE FROM usuarios WHERE email = $1', [testEmail]);

    // 1. Create User
    const user = await UsuarioModel.create('Internal Test', testEmail, 'passHash');
    console.log(`✅ User created: ${user.email}`);

    // 2. Forgot Password
    console.log('Testing forgotPassword()...');
    const req1 = mockRequest({ email: testEmail });
    const res1 = mockResponse();
    
    await forgotPassword(req1, res1);
    
    // Check Response
    if ((res1 as any).statusCode !== 200) throw new Error(`Forgot Password failed: ${JSON.stringify((res1 as any).data)}`);
    console.log('✅ Forgot Password response OK');

    // Check DB for token
    const userAfterForgot = await UsuarioModel.findById(user.id);
    if (!userAfterForgot?.reset_password_token) throw new Error('Token not saved in DB');
    const token = userAfterForgot.reset_password_token;
    console.log('✅ Token saved in DB:', token);

    // 3. Reset Password
    console.log('Testing resetPassword()...');
    const req2 = mockRequest({ token, password: 'newSecureSyncPassword' });
    const res2 = mockResponse();

    await resetPassword(req2, res2);

    if ((res2 as any).statusCode !== 200) throw new Error(`Reset Password failed: ${JSON.stringify((res2 as any).data)}`);
    console.log('✅ Reset Password response OK');

    // Check DB for cleared token
    const userFinal = await UsuarioModel.findById(user.id);
    if (userFinal?.reset_password_token) throw new Error('Token NOT cleared');
    if (userFinal?.password_hash === 'passHash') throw new Error('Password hash NOT updated');
    console.log('✅ DB updated correctly (Token cleared, Hash changed)');

    console.log('\n🎉 ALL INTERNAL TESTS PASSED!');

  } catch (error) {
    console.error('❌ Test Failed:', error);
  } finally {
    // Cleanup
    await pool.query('DELETE FROM usuarios WHERE email = $1', [testEmail]);
    await pool.end();
  }
}

runTest();
