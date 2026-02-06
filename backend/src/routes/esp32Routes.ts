
import express from 'express';
import { receiveData, getData } from '../controllers/esp32Controller';

const router = express.Router();

router.post('/data', receiveData);
router.get('/data/:macAddress', getData);

export default router;
