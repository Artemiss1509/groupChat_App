import cron from 'node-cron';
import { archiveOldMessages } from './messageArchive.js';


export const initializeCronJobs = () => {
    console.log('[Cron Jobs] Initializing cron jobs...');

    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron Jobs] Running nightly message archival at', new Date().toISOString());
        
        try {
            const result = await archiveOldMessages();
            
            if (result.success) {
                console.log(`Cron Jobs - Archive completed:  ${result.archivedCount} messages archived`);
            } else {
                console.error(`Cron Jobs - Archive failed: `, result.error);
            }
        } catch (error) {
            console.error('Cron Jobs - Error in cron job execution:', error);
        }
    }, {
        timezone: "Asia/Kolkata"
    });

    console.log('Cron Jobs - Message archival cron job scheduled for midnight daily');
};