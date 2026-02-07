
import { Request, Response } from 'express';
import { EventoCaidaModel } from '../models/eventoCaida';
import { AuthRequest } from '../middleware/auth';
import { AlertService } from '../services/alertService';

export const resolveEvent = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = parseInt(req.params.id as string);
    const atendidoPorId = req.user?.id; // Assumes AuthRequest has user populated (caregiver/admin)
    const userRole = req.user?.role;

    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    if (!atendidoPorId) {
      return res.status(401).json({ message: 'User not identified' });
    }

    // TODO: Optional - Check if user has permission to resolve THIS specific event?
    // For now, any authorized caregiver/admin can resolve it.

    const updatedEvent = await EventoCaidaModel.markAsResolved(eventId, atendidoPorId);

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Broadcast the resolution so all clients update their UI
    AlertService.broadcast({
      type: 'EVENT_RESOLVED',
      data: updatedEvent
    });

    res.json({ message: 'Event mark as resolved', event: updatedEvent });

  } catch (error) {
    console.error('Error resolving event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, startDate, endDate, limit, macAddress } = req.query;

    // Si se proporciona usuario, filtrar por él
    if (userId) {
      const events = await EventoCaidaModel.findByUsuario(
        Number(userId),
        Number(limit) || 50,
      );
      return res.json(events);
    }

    // Si se proporciona MAC, filtrar por dispositivo
    if (macAddress) {
      const events = await EventoCaidaModel.findByDispositivo(
        String(macAddress),
        Number(limit) || 50
      );
      return res.json(events);
    }

    // Si es rango de fechas
    if (startDate && endDate) {
      const events = await EventoCaidaModel.findByFechas(
        new Date(String(startDate)),
        new Date(String(endDate)),
      );
      return res.json(events);
    }

    // Si no, devolver pendientes (dashboard admin/cuidador)
    const events = await EventoCaidaModel.findPendientes();
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Error fetching events" });
  }
};
