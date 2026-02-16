
import { Request, Response } from 'express';
import { EventoCaidaModel } from '../models/eventoCaida';
import { AuthRequest } from '../middleware/auth';
import { AlertService } from '../services/alertService';

export const resolveEvent = async (req: AuthRequest, res: Response) => {
  try {
    const eventId = parseInt(req.params.id as string);
    console.log(`[RESOLVE] Attempting to resolve event ${eventId} by user ${req.user?.id}`);

    const atendidoPorId = req.user?.id; // Asume que AuthRequest tiene usuario poblado (cuidador/admin)
    const userRole = req.user?.role;

    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    if (!atendidoPorId) {
      return res.status(401).json({ message: 'User not identified' });
    }

    // TODO: Opcional - ¿Verificar si el usuario tiene permiso para resolver ESTE evento específico?
    // Por ahora, cualquier cuidador/admin autorizado puede resolverlo.

    const { status, notes, severity } = req.body;
    const finalStatus = status === 'falsa_alarma' ? 'falsa_alarma' : 'atendida';

    console.log(`[RESOLVE] Details: status=${finalStatus}, notes=${notes}, severity=${severity}`);

    const updatedEvent = await EventoCaidaModel.resolveWithDetails(
      eventId,
      atendidoPorId,
      finalStatus,
      notes,
      severity
    );
    console.log(`[RESOLVE] Result for event ${eventId}:`, updatedEvent);

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // NUEVO: Obtener evento poblado para tener atendido_por_nombre para la transmisión
    const populatedEvent = await EventoCaidaModel.findById(eventId);
    console.log(`[RESOLVE] Populated event for broadcast:`, JSON.stringify(populatedEvent, null, 2));

    if (populatedEvent && !populatedEvent.atendido_por_nombre) {
      console.warn(`[RESOLVE] WARNING: atendido_por_nombre is missing. Check JOIN with cuidadores table. atendido_por ID: ${populatedEvent.atendido_por}`);
    }

    // Transmitir la resolución para que todos los clientes actualicen su UI
    AlertService.broadcast({
      type: 'EVENT_RESOLVED',
      data: populatedEvent || updatedEvent
    });

    res.json({ message: 'Event mark as resolved', event: populatedEvent || updatedEvent });

  } catch (error) {
    console.error('Error resolving event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, deviceId, startDate, endDate, limit } = req.query;

    // Si se proporciona deviceId, filtrar por él (Priority over user if both present, or handle logic)
    if (deviceId) {
      const events = await EventoCaidaModel.findByDispositivo(
        String(deviceId),
        Number(limit) || 50
      );
      return res.json(events);
    }

    // Si se proporciona usuario, filtrar por él
    if (userId) {
      const events = await EventoCaidaModel.findByUsuario(
        Number(userId),
        Number(limit) || 50,
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
