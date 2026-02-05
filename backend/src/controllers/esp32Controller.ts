import { Request, Response } from 'express';
import { ESP32Service } from '../services/esp32Service';

export const receiveData = async (req: Request, res: Response) => {
  try {
    await ESP32Service.processTelemetry(req.body);
    res.status(200).json({ message: 'Data received successfully' });
  } catch (error: any) {
    if (error.message === 'Mac Address is required') {
        return res.status(400).json({ message: error.message });
    }
    console.error('Error receiving ESP32 data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getData = async (req: Request, res: Response) => {
  try {
    const { macAddress } = req.params;

    if (!macAddress || typeof macAddress !== 'string') {
      return res.status(400).json({ message: 'Valid Mac Address is required' });
    }

    const data = await ESP32Service.getDeviceData(macAddress);

    if (!data) {
      return res.status(404).json({ message: 'Device data not found' });
    }

    res.status(200).json(data);
  } catch (error: any) {
    console.error('Error getting ESP32 data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
