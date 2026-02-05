import { Request, Response } from 'express';
import { ESP32Cache } from '../config/redis';
import { ESP32 } from '../models/esp32';
import { DispositivoModel } from '../models/dispositivo';

export const receiveData = async (req: Request, res: Response) => {
  try {
    const esp32Data: ESP32 = req.body;

    if (!esp32Data.macAddress) {
      return res.status(400).json({ message: 'MAC Address is required' });
    }

    // 1. Guardar estado actual en Redis
    await ESP32Cache.setDeviceData(esp32Data.macAddress, esp32Data);

    // 2. Añadir al historial
    await ESP32Cache.addDeviceHistory(esp32Data.macAddress, esp32Data);

    // 3. Actualizar estado de conexión
    await ESP32Cache.setDeviceStatus(esp32Data.macAddress, esp32Data.status);

    // 4. Actualizar datos en PostgreSQL
    await DispositivoModel.actualizarDatosESP32(
      esp32Data.macAddress, 
      esp32Data.impact_count, 
      esp32Data.impact_magnitude
    );

    // 5. Verificar caída detectada o botón SOS
    if (esp32Data.isFallDetected || esp32Data.isButtonPressed) {
        await ESP32Cache.setFallAlert(esp32Data.macAddress, {
          ...esp32Data,
          type: esp32Data.isButtonPressed ? 'SOS_BUTTON' : 'FALL_DETECTED',
          severity: esp32Data.isButtonPressed ? 'critical' : 'high'
        });
        console.log(`⚠️ ${esp32Data.isButtonPressed ? 'SOS BUTTON' : 'FALL DETECTED'} for device ${esp32Data.macAddress}`);
        
        // TODO: Aquí se puede añadir lógica para crear evento_caida en PostgreSQL
        // y enviar notificaciones a cuidadores
    }

    res.status(200).json({ message: 'Data received successfully' });
  } catch (error: any) {
    console.error('Error receiving ESP32 data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getData = async (req: Request, res: Response) => {
  try {
    const { macAddress } = req.params;

    if (!macAddress || typeof macAddress !== 'string') {
      return res.status(400).json({ message: 'Valid MAC Address is required' });
    }

    const data = await ESP32Cache.getDeviceData(macAddress);

    if (!data) {
      return res.status(404).json({ message: 'Device data not found' });
    }

    res.status(200).json(data);
  } catch (error: any) {
    console.error('Error getting ESP32 data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
