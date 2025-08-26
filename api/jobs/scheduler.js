import cron from 'node-cron';
import backupJob from './backup.js';

// Schedule daily backup at 2:00 AM
const scheduleDailyBackup = () => {
    console.log('Setting up daily backup schedule...');
    
    // Run backup every day at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('🕐 Daily backup cron job triggered at 2:00 AM');
        try {
            await backupJob.performFullBackup();
        } catch (error) {
            console.error('Daily backup cron job failed:', error);
        }
    }, {
        scheduled: true,
        timezone: process.env.TZ || 'UTC'
    });
    
    console.log('✅ Daily backup scheduled for 2:00 AM');
};

// Run backup once when API starts
const runInitialBackup = async () => {
    console.log('🚀 Running initial backup on API startup...');
    try {
        await backupJob.performFullBackup();
        console.log('✅ Initial backup completed successfully');
    } catch (error) {
        console.error('❌ Initial backup failed:', error);
    }
};

// Initialize all scheduled jobs
const initializeScheduler = async () => {
    console.log('🔄 Initializing backup scheduler...');
    
    // Run initial backup when API starts
    await runInitialBackup();
    
    // Schedule daily backup
    if (process.env.ENABLE_DAILY_BACKUP === 'true') {
        scheduleDailyBackup();
    } else {
        console.log('⚠️ Daily backup is disabled. Set ENABLE_DAILY_BACKUP=true to enable.');
    }
    
    console.log('✅ Backup scheduler initialized');
};

export default {
    initializeScheduler,
    scheduleDailyBackup,
    runInitialBackup,
}; 