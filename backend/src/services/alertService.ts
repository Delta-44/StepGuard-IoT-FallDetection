import { Response } from 'express';
import { UsuarioModel } from '../models/usuario';
import { DiscordService } from './discordService';

interface ConnectedClient {
    res: Response;
    userId: number;
    role: 'usuario' | 'cuidador' | 'admin';
}

export class AlertService {
    private static clients: ConnectedClient[] = [];

    /**
     * Agregar un nuevo cliente SSE
     * @param res Objeto Response de Express
     * @param userId ID de usuario extraído del token
     * @param role Rol de usuario extraído del token
     */
    static addClient(res: Response, userId: number, role: 'usuario' | 'cuidador' | 'admin') {
        // Encabezados para SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Contenido inicial
        const initData = JSON.stringify({ message: 'Connected to Targeted Alert Stream' });
        res.write(`data: ${initData}\n\n`);

        const newClient: ConnectedClient = { res, userId, role };
        this.clients.push(newClient);
        console.log(`New SSE Client connected (ID: ${userId}, Role: ${role}). Total: ${this.clients.length}`);

        // Eliminar cliente al cerrar
        res.on('close', () => {
            this.clients = this.clients.filter(c => c.res !== res);
            console.log(`SSE Client disconnected (ID: ${userId}). Total: ${this.clients.length}`);
        });
    }

    /**
     * Transmitir una alerta SOLO a clientes relevantes
     * @param alert Datos del evento que contienen 'dispositivo_mac' y la carga útil del evento
     */
    static async broadcast(alert: { type: string, data: any }) {


        const macAddress = alert.data.dispositivo_mac;
        if (!macAddress) {
            console.warn('Alert has no MAC address, cannot target recipients. Broadcasting to Admins only.');
            return;
        }

        console.log(`Processing alert for device ${macAddress}...`);

        try {
            // 1. Encontrar al Usuario dueño de este dispositivo
            const deviceOwner = await UsuarioModel.findByDispositivo(macAddress);

            const allowedUserIds = new Set<number>();
            const allowedCaregiverIds = new Set<number>();

            if (deviceOwner) {
                // El Dueño (Usuario) puede verlo
                allowedUserIds.add(deviceOwner.id);

                // 2. Encontrar Cuidadores asignados a este Usuario
                const caregivers = await UsuarioModel.getCuidadoresAsignados(deviceOwner.id);
                caregivers.forEach(c => allowedCaregiverIds.add(c.id));

                console.log(`Target Audience: User ${deviceOwner.id} and ${caregivers.length} Caregivers`);
            } else {
                console.log(`No owner found for device ${macAddress}. Only Admins will see this.`);
            }

            // 3. Enviar a clientes coincidentes
            const data = JSON.stringify(alert);
            let sentCount = 0;

            this.clients.forEach(client => {
                let shouldSend = false;

                if (client.role === 'admin') {
                    shouldSend = true;
                } else if (client.role === 'usuario' && deviceOwner && client.userId === deviceOwner.id) {
                    shouldSend = true;
                } else if (client.role === 'cuidador' && allowedCaregiverIds.has(client.userId)) {
                    shouldSend = true;
                }

                if (shouldSend) {
                    client.res.write(`data: ${data}\n\n`);
                    sentCount++;
                }
            });

            if (sentCount > 0) {
                console.log(`Alert sent to ${sentCount} relevant clients.`);
            }

        } catch (err) {
            console.error('Error broadcasting alert:', err);
        }

        // Enviar a Discord
        try {
            await DiscordService.sendAlert(alert);
        } catch (error) {
            console.error('Error sending alert to Discord:', error);
        }
    }
}
