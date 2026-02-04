
import { Request, Response } from 'express';
import { ESP32Cache } from '../config/redis';

export const receiveData = async (req: Request, res: Response) => {
  try {
    const { deviceId, ...data } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: 'Device ID is required' });
    }

    // 1. Save current state
    await ESP32Cache.setDeviceData(deviceId, data);

    // 2. Add to history
    await ESP32Cache.addDeviceHistory(deviceId, data);

    // 3. Update status to online
    await ESP32Cache.setDeviceStatus(deviceId, 'online');

    // 4. Check for fall detection
    if (data.isFallDetected) {
        await ESP32Cache.setFallAlert(deviceId, data);
        console.log(`⚠️ FALL DETECTED for device ${deviceId}`);
    }

    res.status(200).json({ message: 'Data received successfully' });
  } catch (error: any) {
    console.error('Error receiving ESP32 data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getData = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    if (!deviceId || typeof deviceId !== 'string') {
      return res.status(400).json({ message: 'Valid Device ID is required' });
    }

    const data = await ESP32Cache.getDeviceData(deviceId);

    if (!data) {
      return res.status(404).json({ message: 'Device data not found' });
    }

    res.status(200).json(data);
  } catch (error: any) {
    console.error('Error getting ESP32 data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
