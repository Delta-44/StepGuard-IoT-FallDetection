import { query } from '../config/database';

export class SchedulerService {
    private static intervalId: NodeJS.Timeout | null = null;
    private static readonly CHECK_INTERVAL_MS = 60 * 1000; // Run every 1 minute
    private static readonly OFFLINE_THRESHOLD_MINUTES = 3;

    /**
     * Start the scheduler to check for offline devices
     */
    static start() {
        if (this.intervalId) {
            console.log('⚠️ Scheduler is already running.');
            return;
        }

        console.log('⏰ SchedulerService started. Checking for offline devices every minute.');

        // Initial check immediately
        this.markInactiveDevicesAsOffline();

        this.intervalId = setInterval(() => {
            this.markInactiveDevicesAsOffline();
        }, this.CHECK_INTERVAL_MS);
    }

    /**
     * Stop the scheduler
     */
    static stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('🛑 SchedulerService stopped.');
        }
    }

    /**
     * Logic to mark devices as offline in Postgres
     */
    private static async markInactiveDevicesAsOffline() {
        try {
            // Update devices that are 'true' (active) but haven't updated in > 3 mins
            // Postgres interval syntax: "NOW() - INTERVAL '3 minutes'"
            const result = await query(
                `UPDATE dispositivos 
                 SET estado = false 
                 WHERE estado = true 
                 AND ultima_conexion < NOW() - INTERVAL '${this.OFFLINE_THRESHOLD_MINUTES} minutes'
                 RETURNING mac_address, nombre`
            );

            if (result.rowCount && result.rowCount > 0) {
                console.log(`📉 Marked ${result.rowCount} devices as OFFLINE due to inactivity:`);
                result.rows.forEach(device => {
                    console.log(`   - ${device.nombre} (${device.mac_address})`);
                });
            }
        } catch (error) {
            console.error('❌ Error in SchedulerService:', error);
        }
    }
}
