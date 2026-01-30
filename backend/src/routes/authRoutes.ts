import express from 'express';
import { register } from '../controllers/registerController';
import { login } from '../controllers/loginController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

export default router;
