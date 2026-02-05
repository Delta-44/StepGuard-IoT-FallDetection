
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
