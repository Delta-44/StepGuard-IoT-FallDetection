import { Request, Response } from 'express';
import { ESP32Service } from '../services/esp32Service';
import { DispositivoModel } from '../models/dispositivo';

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

export const getAllDevices = async (req: Request, res: Response) => {
  try {
    const devices = await DispositivoModel.findAllWithUser();
    res.json(devices);
  } catch (error: any) {
    console.error('Error fetching all devices:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateDevice = async (req: Request, res: Response) => {
  try {
    const { macAddress } = req.params;
    const { nombre } = req.body;

    // Verificación de Auth
    // Asumiendo que req.user es poblado por el middleware.
    // El middleware define req.user.
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!macAddress) {
      return res.status(400).json({ message: 'MAC address is required' });
    }

    if (!nombre) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Verificar Autorización
    if (user.role !== 'admin') {
      // Si no es admin, debe ser el dueño
      const assignedUser = await DispositivoModel.getUsuarioAsignado(macAddress as string);

      if (!assignedUser) {
        // El dispositivo no tiene dueño, los no-admins no pueden editar
        return res.status(403).json({ message: 'Forbidden. Device not assigned to you.' });
      }

      if (assignedUser.id !== user.id) {
        return res.status(403).json({ message: 'Forbidden. Device not assigned to you.' });
      }
    }

    const updatedDevice = await DispositivoModel.update(macAddress as string, nombre);

    if (!updatedDevice) {
      return res.status(404).json({ message: 'Device not found' });
    }

    res.status(200).json({
      message: "Device updated successfully",
      device: updatedDevice
    });

  } catch (error: any) {
    console.error('Error updating ESP32 data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
