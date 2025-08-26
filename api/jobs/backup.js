import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// AWS S3 Configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// Database configuration
const dbConfig = {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    username: process.env.POSTGRES_USER ,
    password: process.env.POSTGRES_PASSWORD ,
};

// Backup configuration
const backupConfig = {
    backupDir: process.env.BACKUP_DIR || path.join(__dirname, '../../backups'),
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    s3BackupBucket: process.env.S3_BACKUP_BUCKET || process.env.AWS_BUCKET_NAME,
    s3BackupPrefix: process.env.S3_BACKUP_PREFIX || 'backups',
};

/**
 * Create backup directory if it doesn't exist
 */
const ensureBackupDir = () => {
    if (!fs.existsSync(backupConfig.backupDir)) {
        fs.mkdirSync(backupConfig.backupDir, { recursive: true });
    }
};

/**
 * Generate timestamp for backup files
 */
const getTimestamp = () => {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
           now.toTimeString().split(' ')[0].replace(/:/g, '-');
};

/**
 * Perform database dump using pg_dump
 */
const performDatabaseDump = async () => {
    const timestamp = getTimestamp();
    const dumpFileName = `database_backup_${timestamp}.sql`;
    const dumpFilePath = path.join(backupConfig.backupDir, dumpFileName);
    
    const pgDumpCommand = `PGPASSWORD="${dbConfig.password}" pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -f "${dumpFilePath}" --no-password`;
    
    try {
        console.log(`Starting database backup: ${dumpFileName}`);
        await execAsync(pgDumpCommand);
        
        // Compress the dump file
        const compressedFileName = `${dumpFileName}.gz`;
        const compressedFilePath = path.join(backupConfig.backupDir, compressedFileName);
        await execAsync(`gzip -c "${dumpFilePath}" > "${compressedFilePath}"`);
        
        // Remove uncompressed file
        fs.unlinkSync(dumpFilePath);
        
        console.log(`Database backup completed: ${compressedFileName}`);
        return compressedFilePath;
    } catch (error) {
        console.error('Database backup failed:', error.message);
        throw error;
    }
};

/**
 * List all objects in S3 bucket
 */
const listS3Objects = async () => {
    try {
        const objects = [];
        let continuationToken = null;
        
        do {
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                MaxKeys: 1000,
                ...(continuationToken && { ContinuationToken: continuationToken })
            };
            
            const response = await s3.listObjectsV2(params).promise();
            objects.push(...response.Contents);
            continuationToken = response.NextContinuationToken;
        } while (continuationToken);
        
        return objects;
    } catch (error) {
        console.error('Failed to list S3 objects:', error.message);
        throw error;
    }
};

/**
 * Download S3 object to local file
 */
const downloadS3Object = async (key, localPath) => {
    try {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
        };
        
        const response = await s3.getObject(params).promise();
        fs.writeFileSync(localPath, response.Body);
        return true;
    } catch (error) {
        console.error(`Failed to download S3 object ${key}:`, error.message);
        return false;
    }
};

/**
 * Perform S3 images backup
 */
const performS3Backup = async () => {
    const timestamp = getTimestamp();
    const imagesBackupDir = path.join(backupConfig.backupDir, `images_backup_${timestamp}`);
    
    try {
        console.log('Starting S3 images backup...');
        
        // Create images backup directory
        if (!fs.existsSync(imagesBackupDir)) {
            fs.mkdirSync(imagesBackupDir, { recursive: true });
        }
        
        // List all S3 objects
        const s3Objects = await listS3Objects();
        console.log(`Found ${s3Objects.length} objects in S3 bucket`);
        
        // Download each object
        const downloadPromises = s3Objects.map(async (object) => {
            const key = object.Key;
            const fileName = key.replace(/[^a-zA-Z0-9.-]/g, '_');
            const localPath = path.join(imagesBackupDir, fileName);
            
            return await downloadS3Object(key, localPath);
        });
        
        const results = await Promise.allSettled(downloadPromises);
        const successfulDownloads = results.filter(result => result.status === 'fulfilled' && result.value).length;
        
        console.log(`S3 backup completed: ${successfulDownloads}/${s3Objects.length} images downloaded`);
        
        // Create manifest file
        const manifestPath = path.join(imagesBackupDir, 'manifest.json');
        const manifest = {
            timestamp: timestamp,
            totalObjects: s3Objects.length,
            successfulDownloads: successfulDownloads,
            objects: s3Objects.map(obj => ({
                key: obj.Key,
                size: obj.Size,
                lastModified: obj.LastModified,
                etag: obj.ETag
            }))
        };
        
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        
        // Compress the entire images directory
        const compressedFileName = `images_backup_${timestamp}.tar.gz`;
        const compressedFilePath = path.join(backupConfig.backupDir, compressedFileName);
        await execAsync(`tar -czf "${compressedFilePath}" -C "${backupConfig.backupDir}" "images_backup_${timestamp}"`);
        
        // Remove uncompressed directory
        await execAsync(`rm -rf "${imagesBackupDir}"`);
        
        console.log(`S3 images backup completed: ${compressedFileName}`);
        return compressedFilePath;
    } catch (error) {
        console.error('S3 backup failed:', error.message);
        throw error;
    }
};

/**
 * Upload backup files to S3 backup bucket
 */
const uploadBackupToS3 = async (localFilePath) => {
    try {
        const fileName = path.basename(localFilePath);
        const s3Key = `${backupConfig.s3BackupPrefix}/${fileName}`;
        
        const fileContent = fs.readFileSync(localFilePath);
        const params = {
            Bucket: backupConfig.s3BackupBucket,
            Key: s3Key,
            Body: fileContent,
            ContentType: 'application/gzip',
            Metadata: {
                'backup-date': getTimestamp(),
                'backup-type': fileName.includes('database') ? 'database' : 'images'
            }
        };
        
        await s3.upload(params).promise();
        console.log(`Backup uploaded to S3: ${s3Key}`);
        
        // Remove local backup file after successful upload
        fs.unlinkSync(localFilePath);
        
        return s3Key;
    } catch (error) {
        console.error('Failed to upload backup to S3:', error.message);
        throw error;
    }
};


/**
 * Main backup function
 */
const performFullBackup = async () => {
    const startTime = new Date();
    console.log(`=== Starting daily backup at ${startTime.toISOString()} ===`);
    
    try {
        // Ensure backup directory exists
        ensureBackupDir();
        
        // Perform database backup
        const dbBackupPath = await performDatabaseDump();
        await uploadBackupToS3(dbBackupPath);
        
        // Perform S3 images backup
        const imagesBackupPath = await performS3Backup();
        await uploadBackupToS3(imagesBackupPath);
        
        const endTime = new Date();
        const duration = (endTime - startTime) / 1000;
        console.log(`=== Backup completed successfully in ${duration} seconds ===`);
        
        return {
            success: true,
            duration: duration,
            timestamp: startTime.toISOString()
        };
    } catch (error) {
        const endTime = new Date();
        const duration = (endTime - startTime) / 1000;
        console.error(`=== Backup failed after ${duration} seconds ===`);
        console.error('Error:', error.message);
        
        return {
            success: false,
            error: error.message,
            duration: duration,
            timestamp: startTime.toISOString()
        };
    }
};

/**
 * Manual backup trigger function (for API calls)
 */
const triggerManualBackup = async (req, res) => {
    try {
        console.log('Manual backup triggered via API');
        const result = await performFullBackup();
        
        if (result.success) {
            res.status(200).json({
                success: true,
                message: 'Backup completed successfully',
                duration: result.duration,
                timestamp: result.timestamp
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Backup failed',
                error: result.error,
                duration: result.duration,
                timestamp: result.timestamp
            });
        }
    } catch (error) {
        console.error('Manual backup error:', error);
        res.status(500).json({
            success: false,
            message: 'Backup failed',
            error: error.message
        });
    }
};

/**
 * Get backup status
 */
const getBackupStatus = async (req, res) => {
    try {
        const s3Params = {
            Bucket: backupConfig.s3BackupBucket,
            Prefix: backupConfig.s3BackupPrefix,
        };
        
        const s3Objects = await s3.listObjectsV2(s3Params).promise();
        const backups = s3Objects.Contents || [];
        
        // Group backups by date
        const backupGroups = {};
        backups.forEach(backup => {
            const date = backup.LastModified.toISOString().split('T')[0];
            if (!backupGroups[date]) {
                backupGroups[date] = [];
            }
            backupGroups[date].push({
                key: backup.Key,
                size: backup.Size,
                lastModified: backup.LastModified,
                type: backup.Key.includes('database') ? 'database' : 'images'
            });
        });
        
        res.status(200).json({
            success: true,
            totalBackups: backups.length,
            backupGroups: backupGroups,
            retentionDays: backupConfig.retentionDays
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get backup status',
            error: error.message
        });
    }
};

export default {
    performFullBackup,
    triggerManualBackup,
    getBackupStatus,
    performDatabaseDump,
    performS3Backup
}; 