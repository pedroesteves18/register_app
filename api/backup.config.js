// Backup Configuration
// Add these environment variables to your .env file or Docker environment

export const backupConfig = {
    // Database Configuration
    DB_HOST: process.env.DB_HOST || 'postgres',
    DB_PORT: process.env.DB_PORT || 5432,
    DB_NAME: process.env.DB_NAME || 'register_app',
    DB_USER: process.env.DB_USER || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || 'password',

    // AWS S3 Configuration
    AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,

    // Backup Configuration
    BACKUP_DIR: process.env.BACKUP_DIR || '/backups',
    BACKUP_RETENTION_DAYS: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    S3_BACKUP_BUCKET: process.env.S3_BACKUP_BUCKET || process.env.AWS_BUCKET_NAME,
    S3_BACKUP_PREFIX: process.env.S3_BACKUP_PREFIX || 'backups',

    // Scheduler Configuration
    ENABLE_DAILY_BACKUP: process.env.ENABLE_DAILY_BACKUP === 'true',
    TZ: process.env.TZ || 'UTC'
};

// Example .env configuration:
/*
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=register_app
DB_USER=postgres
DB_PASSWORD=password

# AWS S3 Configuration
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_bucket_name

# Backup Configuration
BACKUP_DIR=/backups
BACKUP_RETENTION_DAYS=30
S3_BACKUP_BUCKET=your_backup_bucket_name
S3_BACKUP_PREFIX=backups

# Scheduler Configuration
ENABLE_DAILY_BACKUP=true
TZ=UTC
*/ 