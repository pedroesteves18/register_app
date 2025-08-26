# Backup System Documentation

## Overview

This backup system provides automated daily backups of both database data and S3 images. It includes:

- **Database Backup**: PostgreSQL database dumps using `pg_dump`
- **S3 Images Backup**: Complete backup of all images stored in AWS S3
- **Automated Scheduling**: Daily and weekly backup schedules using cron jobs
- **Manual Triggers**: API endpoints for manual backup execution
- **Retention Management**: Automatic cleanup of old backups
- **S3 Storage**: Backup files are stored in S3 for redundancy

## Features

### 🔄 Automated Backups
- **Daily Backup**: Runs every day at 2:00 AM
- **Weekly Backup**: Runs every Sunday at 3:00 AM
- **Configurable Schedule**: Easy to modify timing and frequency

### 📊 Database Backup
- Full PostgreSQL database dump
- Compressed with gzip for storage efficiency
- Includes all tables, indexes, and data

### 🖼️ S3 Images Backup
- Downloads all images from S3 bucket
- Creates manifest file with metadata
- Compressed as tar.gz archive
- Preserves original file structure

### 🗂️ Backup Management
- **Retention Policy**: Configurable backup retention (default: 30 days)
- **Automatic Cleanup**: Removes old backups from both local and S3 storage
- **Backup Status**: API endpoint to check backup history and status

### 🔐 Security
- Admin-only access to backup endpoints
- JWT token authentication required
- Secure S3 upload with proper credentials

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=register_app
DB_USER=postgres
DB_PASSWORD=your_password

# AWS S3 Configuration
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_bucket_name

# Backup Configuration
BACKUP_DIR=/path/to/backup/directory
BACKUP_RETENTION_DAYS=30
S3_BACKUP_BUCKET=your_backup_bucket_name
S3_BACKUP_PREFIX=backups

# Scheduler Configuration
ENABLE_DAILY_BACKUP=true
ENABLE_WEEKLY_BACKUP=true
TZ=UTC
```

### Backup Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_DIR` | `./backups` | Local directory for temporary backup files |
| `BACKUP_RETENTION_DAYS` | `30` | Number of days to keep backups |
| `S3_BACKUP_BUCKET` | `AWS_BUCKET_NAME` | S3 bucket for storing backup files |
| `S3_BACKUP_PREFIX` | `backups` | S3 key prefix for backup files |
| `ENABLE_DAILY_BACKUP` | `false` | Enable daily backup schedule |
| `ENABLE_WEEKLY_BACKUP` | `false` | Enable weekly backup schedule |
| `TZ` | `UTC` | Timezone for backup scheduling |

## API Endpoints

### Authentication Required
All backup endpoints require admin authentication with JWT token.

### Manual Backup Triggers

#### Trigger Full Backup
```http
POST /api/backup/trigger
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Backup completed successfully",
  "duration": 45.2,
  "timestamp": "2024-01-15T02:00:00.000Z"
}
```

#### Trigger Database Backup Only
```http
POST /api/backup/database
Authorization: Bearer <jwt_token>
```

#### Trigger S3 Images Backup Only
```http
POST /api/backup/images
Authorization: Bearer <jwt_token>
```

### Backup Status

#### Get Backup History
```http
GET /api/backup/status
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "totalBackups": 15,
  "retentionDays": 30,
  "backupGroups": {
    "2024-01-15": [
      {
        "key": "backups/database_backup_2024-01-15_02-00-00.sql.gz",
        "size": 1048576,
        "lastModified": "2024-01-15T02:00:00.000Z",
        "type": "database"
      },
      {
        "key": "backups/images_backup_2024-01-15_02-00-00.tar.gz",
        "size": 5242880,
        "lastModified": "2024-01-15T02:00:00.000Z",
        "type": "images"
      }
    ]
  }
}
```

## Backup Process

### 1. Database Backup
1. Creates timestamped SQL dump file
2. Compresses with gzip
3. Uploads to S3 backup bucket
4. Removes local file after successful upload

### 2. S3 Images Backup
1. Lists all objects in S3 bucket
2. Downloads each image to local directory
3. Creates manifest file with metadata
4. Compresses entire directory as tar.gz
5. Uploads to S3 backup bucket
6. Removes local files after successful upload

### 3. Cleanup Process
1. Removes local backup files older than retention period
2. Removes S3 backup files older than retention period
3. Logs cleanup activities

## File Structure

### Backup Files
```
backups/
├── database_backup_2024-01-15_02-00-00.sql.gz
├── images_backup_2024-01-15_02-00-00.tar.gz
└── ...
```

### S3 Backup Structure
```
s3://your-backup-bucket/
└── backups/
    ├── database_backup_2024-01-15_02-00-00.sql.gz
    ├── images_backup_2024-01-15_02-00-00.tar.gz
    └── ...
```

## Monitoring and Logs

### Console Logs
The backup system provides detailed console logging:

```
=== Starting daily backup at 2024-01-15T02:00:00.000Z ===
Starting database backup: database_backup_2024-01-15_02-00-00.sql
Database backup completed: database_backup_2024-01-15_02-00-00.sql.gz
Starting S3 images backup...
Found 150 objects in S3 bucket
S3 backup completed: 150/150 images downloaded
S3 images backup completed: images_backup_2024-01-15_02-00-00.tar.gz
Backup uploaded to S3: backups/database_backup_2024-01-15_02-00-00.sql.gz
Backup uploaded to S3: backups/images_backup_2024-01-15_02-00-00.tar.gz
Cleaning up old backups...
Removed old local backup: database_backup_2024-01-10_02-00-00.sql.gz
Removed old S3 backup: backups/database_backup_2024-01-10_02-00-00.sql.gz
Cleanup completed
=== Backup completed successfully in 45.2 seconds ===
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
**Error:** `Database backup failed: connection refused`
**Solution:** Check database credentials and connection settings

#### 2. S3 Permission Error
**Error:** `Failed to upload backup to S3: Access Denied`
**Solution:** Verify AWS credentials and S3 bucket permissions

#### 3. Disk Space Error
**Error:** `ENOSPC: no space left on device`
**Solution:** Check available disk space in backup directory

#### 4. pg_dump Not Found
**Error:** `pg_dump: command not found`
**Solution:** Install PostgreSQL client tools

### Manual Recovery

#### Restore Database
```bash
# Download backup from S3
aws s3 cp s3://your-backup-bucket/backups/database_backup_2024-01-15_02-00-00.sql.gz .

# Decompress and restore
gunzip database_backup_2024-01-15_02-00-00.sql.gz
psql -h localhost -U postgres -d register_app < database_backup_2024-01-15_02-00-00.sql
```

#### Restore S3 Images
```bash
# Download backup from S3
aws s3 cp s3://your-backup-bucket/backups/images_backup_2024-01-15_02-00-00.tar.gz .

# Extract and upload
tar -xzf images_backup_2024-01-15_02-00-00.tar.gz
aws s3 sync images_backup_2024-01-15_02-00-00/ s3://your-bucket-name/
```

## Security Considerations

1. **Access Control**: Only admin users can trigger backups
2. **Encryption**: Consider enabling S3 server-side encryption
3. **Network Security**: Use VPC endpoints for S3 access
4. **Credential Management**: Use IAM roles instead of access keys when possible
5. **Backup Encryption**: Consider encrypting backup files before S3 upload

## Performance Optimization

1. **Parallel Downloads**: S3 images are downloaded in parallel
2. **Compression**: All backups are compressed to reduce storage costs
3. **Incremental Backups**: Consider implementing for large datasets
4. **S3 Transfer Acceleration**: Enable for faster uploads

## Future Enhancements

- [ ] Incremental backup support
- [ ] Backup encryption
- [ ] Backup verification
- [ ] Email notifications
- [ ] Webhook notifications
- [ ] Backup restore API endpoints
- [ ] Backup performance metrics
- [ ] Multi-region backup replication 