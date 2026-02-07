
import express from 'express';
import { receiveData, getData, getAllDevices, updateDevice } from '../controllers/esp32Controller';
import authMiddleware from '../middleware/auth';

const router = express.Router();

router.post('/data', receiveData);
router.get('/data/:macAddress', getData);
router.get('/all', getAllDevices);

// Update device info (Protected)
router.put('/:macAddress', authMiddleware, updateDevice);

export default router;
