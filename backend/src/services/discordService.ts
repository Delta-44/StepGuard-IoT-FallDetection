import { Client, GatewayIntentBits, TextChannel, User, EmbedBuilder, Events } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

export class DiscordService {
    private static client: Client;
    private static targetUserId: string | undefined;
    private static token: string | undefined;
    private static isReady: boolean = false;

    static async initialize() {
        this.token = process.env.DISCORD_BOT_TOKEN;
        this.targetUserId = process.env.DISCORD_TARGET_USER_ID;

        if (!this.token) {
            console.warn('DISCORD_BOT_TOKEN not found in .env. Discord bot will not start.');
            console.warn('Current env keys:', Object.keys(process.env).filter(k => k.startsWith('DISCORD')));
            return;
        }

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.DirectMessages
            ]
        });

        this.client.once(Events.ClientReady, () => {
            console.error(`Discord Bot logged in as ${this.client.user?.tag}`);
            this.isReady = true;
        });

        this.client.on('error', (error) => {
            console.error('Discord Client Error:', error);
        });

        try {
            await this.client.login(this.token);
        } catch (error) {
            console.error('Failed to login to Discord:', error);
        }
    }

    static async sendDirectMessage(message: string | EmbedBuilder) {
        if (!this.isReady || !this.targetUserId) {
            console.warn('Cannot send DM: Discord bot not ready set or Target User ID missing.');
            return;
        }

        try {
            const user = await this.client.users.fetch(this.targetUserId);
            if (user) {
                if (typeof message === 'string') {
                    // Discord limit is 2000 chars. Split into safer chunks (e.g., 1900).
                    const MAX_LENGTH = 1900;
                    if (message.length > MAX_LENGTH) {
                        const chunks = [];
                        for (let i = 0; i < message.length; i += MAX_LENGTH) {
                            chunks.push(message.substring(i, i + MAX_LENGTH));
                        }
                        
                        for (const chunk of chunks) {
                            await user.send({ content: chunk });
                        }
                    } else {
                        await user.send({ content: message });
                    }
                } else {
                    await user.send({ embeds: [message] });
                }
                console.error(`Message sent to Discord user ${this.targetUserId}`);
            } else {
                console.error(`Discord user ${this.targetUserId} not found.`);
            }
        } catch (error) {
            console.error('Error sending DM to Discord user:', error);
        }
    }

    static async sendAlert(alert: { type: string, data: any }) {
        if (!this.isReady) return;

        const { type, data } = alert;
        
        // Customize the message based on alert type/data
        const embed = new EmbedBuilder()
            .setColor(type === 'caida' || data.severidad === 'critical' || data.severidad === 'high' ? 0xFF0000 : 0xFFA500)
            .setTitle(`🚨 StepGuard Alert: ${type.toUpperCase()}`)
            .setTimestamp()
            .addFields(
                { name: 'Device MAC', value: data.dispositivo_mac || 'Unknown', inline: true },
                { name: 'Severity', value: data.severidad || 'Unknown', inline: true },
                { name: 'Status', value: data.estado || 'Unknown', inline: true }
            );

        if (data.usuario_nombre) {
            embed.addFields({ name: 'User', value: data.usuario_nombre });
        }
        
        if (data.is_fall_detected) {
            embed.setDescription('**FALL DETECTED!** Immediate attention required.');
        } else if (data.is_button_pressed) {
            embed.setDescription('**SOS BUTTON PRESSED!** User requested help.');
        } else {
            embed.setDescription('System alert received.');
        }

        if (data.notas) {
             embed.addFields({ name: 'Notes', value: data.notas });
        }

        await this.sendDirectMessage(embed);
    }
}
