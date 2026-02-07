import { Response } from 'express';
import { UsuarioModel } from '../models/usuario';

interface ConnectedClient {
    res: Response;
    userId: number;
    role: 'usuario' | 'cuidador' | 'admin';
}

export class AlertService {
    private static clients: ConnectedClient[] = [];

    /**
     * Add a new SSE client
     * @param res Express Response object
     * @param userId User ID extracted from token
     * @param role User role extracted from token
     */
    static addClient(res: Response, userId: number, role: 'usuario' | 'cuidador' | 'admin') {
        // Headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Initial content
        const initData = JSON.stringify({ message: 'Connected to Targeted Alert Stream' });
        res.write(`data: ${initData}\n\n`);

        const newClient: ConnectedClient = { res, userId, role };
        this.clients.push(newClient);
        console.log(`New SSE Client connected (ID: ${userId}, Role: ${role}). Total: ${this.clients.length}`);

        // Remove client on close
        res.on('close', () => {
            this.clients = this.clients.filter(c => c.res !== res);
            console.log(`SSE Client disconnected (ID: ${userId}). Total: ${this.clients.length}`);
        });
    }

    /**
     * Broadcast an alert ONLY to relevant clients
     * @param alert Event data containing 'dispositivo_mac' and the event payload
     */
    static async broadcast(alert: { type: string, data: any }) {
        if (this.clients.length === 0) return;

        const macAddress = alert.data.dispositivo_mac;
        if (!macAddress) {
            console.warn('Alert has no MAC address, cannot target recipients. Broadcasting to Admins only.');
            return;
        }

        console.log(`Processing alert for device ${macAddress}...`);

        try {
            // 1. Find the User who owns this device
            const deviceOwner = await UsuarioModel.findByDispositivo(macAddress);

            const allowedUserIds = new Set<number>();
            const allowedCaregiverIds = new Set<number>();

            if (deviceOwner) {
                // Owner (User) can see it
                allowedUserIds.add(deviceOwner.id);

                // 2. Find Caregivers assigned to this User
                const caregivers = await UsuarioModel.getCuidadoresAsignados(deviceOwner.id);
                caregivers.forEach(c => allowedCaregiverIds.add(c.id));

                console.log(`Target Audience: User ${deviceOwner.id} and ${caregivers.length} Caregivers`);
            } else {
                console.log(`No owner found for device ${macAddress}. Only Admins will see this.`);
            }

            // 3. Send to matching clients
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
    }
}
