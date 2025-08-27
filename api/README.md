# Register App Backend API

Node.js/Express backend API for the Register App.

## 🚀 Development

### Local Development
```bash
cd api
npm install
npm run dev
```

### Docker Development
```bash
# From root directory
npm run docker:dev
```

## 🏗️ Production

### Docker Production
```bash
# From root directory
npm run docker:prod
```

## 📁 Structure

```
api/
├── config/
│   ├── connection.js        # Database connection setup
│   └── database.js          # Sequelize configuration
├── global/
│   ├── generateToken.js     # JWT token generation
│   ├── verifyAdm.js         # Admin verification middleware
│   └── verifyToken.js       # JWT token verification
├── jobs/
│   ├── backup.js            # Database backup functionality
│   ├── backupRoutes.js      # Backup API routes
│   ├── bucket.js            # S3 bucket operations
│   ├── proxy.js             # S3 proxy for secure file access
│   ├── scheduler.js         # Cron job scheduler
│   └── README.md            # Jobs documentation
├── models/
│   ├── user.js              # User model
│   ├── paciente.js          # Patient model
│   └── cirurgia.js          # Surgery model
├── routes/
│   ├── user.js              # User routes
│   ├── paciente.js          # Patient routes
│   └── cirurgia.js          # Surgery routes
├── services/
│   ├── user.js              # User business logic
│   ├── paciente.js          # Patient business logic
│   └── cirurgia.js          # Surgery business logic
├── app.js                   # Main application file
├── backup.config.js         # Backup configuration
├── Dockerfile               # Docker configuration
└── package.json             # Dependencies
```

## 🔧 Configuration

### Environment Variables

Required environment variables:

```env
# Database
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=register_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Server
PORT=8001
JWT_SECRET=your_jwt_secret
ROUNDS=10
DEFAULT_USER_ACCESS=admin
DEFAULT_USER_2=user
ADM_SECRET=admin_secret

# AWS S3
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_bucket

# Backup
BACKUP_RETENTION_DAYS=30
S3_BACKUP_BUCKET=your_backup_bucket
S3_BACKUP_PREFIX=backups
ENABLE_DAILY_BACKUP=true
TZ=UTC
```

## 🗄️ Database

### Models

- **User**: Authentication and user management
- **Patient**: Patient information and records
- **Surgery**: Surgery records with file attachments

### Migrations

The application uses Sequelize with `sync({ alter: true })` for automatic schema updates.

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation with Joi
- XSS protection
- CORS configuration
- Rate limiting (via Nginx)

## 📊 API Endpoints

### Authentication
- `POST /users/login` - User login

### Patients
- `GET /pacientes/all` - Get all patients
- `POST /pacientes` - Create patient
- `GET /pacientes/:id` - Get patient by ID
- `PUT /pacientes/:id` - Update patient
- `DELETE /pacientes/:id` - Delete patient

### Surgeries
- `GET /cirurgias/all` - Get all surgeries
- `POST /cirurgias/:pacienteId` - Create surgery
- `GET /cirurgias/paciente/:pacienteId` - Get surgeries by patient
- `PUT /cirurgias/:id` - Update surgery
- `DELETE /cirurgias/:id` - Delete surgery

### Backup
- `GET /api/backup/status` - Get backup status
- `POST /api/backup/trigger` - Trigger manual backup

### Proxy
- `GET /proxy/s3` - Secure S3 file access

## 🔄 Background Jobs

### Backup System
- Automated daily backups at 2:00 AM
- S3 integration for backup storage
- Configurable retention period
- Manual backup triggers

### Scheduler
- Cron-based job scheduling
- Timezone support
- Error handling and logging

## 🐳 Docker

### Development Container
- Uses nodemon for hot reloading
- Volume mounting for live code changes
- PostgreSQL client tools included

### Production Container
- Optimized for production
- Health checks
- Proper port exposure
- Backup directory creation

## 📝 Logging

- Console logging for development
- Structured logging for production
- Error tracking and monitoring 