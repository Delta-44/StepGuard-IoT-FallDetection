import express from 'express';
import { registerUsuario, registerCuidador } from '../controllers/registerController';
import { login } from '../controllers/loginController';

const router = express.Router();

router.post('/register/usuario', registerUsuario);
router.post('/register/cuidador', registerCuidador);
router.post('/login', login);

export default router;
