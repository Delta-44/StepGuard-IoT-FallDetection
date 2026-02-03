import express from 'express';
import { registerUsuario, registerCuidador } from '../controllers/registerController';
import { login } from '../controllers/loginController';
import { googleLogin, googleAuthRedirect, googleAuthCallback } from '../controllers/googleAuthController';
import { forgotPassword, resetPassword } from '../controllers/authController';

const router = express.Router();

router.post('/register/usuario', registerUsuario);
router.post('/register/cuidador', registerCuidador);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/google', googleAuthRedirect);
router.get('/google/callback', googleAuthCallback);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
