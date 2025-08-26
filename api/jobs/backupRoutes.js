import { Router } from 'express';
import backupJob from './backup.js';
import verifyToken from '../global/verifyToken.js';
import verifyAdm from '../global/verifyAdm.js';

const router = Router();

// Middleware to ensure only admins can access backup routes
router.use(verifyToken);
router.use(verifyAdm);

/**
 * @route POST /api/backup/trigger
 * @desc Trigger a manual backup
 * @access Admin only
 */
router.post('/trigger', backupJob.triggerManualBackup);

/**
 * @route GET /api/backup/status
 * @desc Get backup status and history
 * @access Admin only
 */
router.get('/status', backupJob.getBackupStatus);

/**
 * @route POST /api/backup/database
 * @desc Trigger database backup only
 * @access Admin only
 */
router.post('/database', async (req, res) => {
    try {
        console.log('Manual database backup triggered');
        const result = await backupJob.performDatabaseDump();
        
        res.status(200).json({
            success: true,
            message: 'Database backup completed successfully',
            file: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Database backup failed',
            error: error.message
        });
    }
});

/**
 * @route POST /api/backup/images
 * @desc Trigger S3 images backup only
 * @access Admin only
 */
router.post('/images', async (req, res) => {
    try {
        console.log('Manual S3 images backup triggered');
        const result = await backupJob.performS3Backup();
        
        res.status(200).json({
            success: true,
            message: 'S3 images backup completed successfully',
            file: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'S3 images backup failed',
            error: error.message
        });
    }
});

export default router; 