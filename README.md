# Register App

A full-stack application with Vue.js frontend, Node.js backend, and PostgreSQL database.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- AWS S3 bucket (for file storage)

### Environment Variables

Create a `.env.production` file in the root directory with the following variables:

```env
# Database Configuration
POSTGRES_DB=register_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# Server Configuration
PORT=8001
JWT_SECRET=your_very_secure_jwt_secret_here
ROUNDS=10
DEFAULT_USER_ACCESS=admin
DEFAULT_USER_2=user
ADM_SECRET=admin_secret

# AWS S3 Configuration
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-s3-bucket-name

# Backup Configuration
BACKUP_RETENTION_DAYS=30
S3_BACKUP_BUCKET=your-backup-bucket-name
S3_BACKUP_PREFIX=backups
ENABLE_DAILY_BACKUP=true
TZ=UTC

# Frontend Configuration
VITE_API_BASE_URL=http://your-domain-or-ip:8001
```

## 🐳 Docker Setup

### Production

To run the application in production mode:

```bash
npm run docker:prod
# or
docker-compose -f docker-compose.prod.yml up -d
```

This will start:
- Frontend: http://localhost (Nginx)
- Backend: http://localhost:8001
- Database: localhost:5432

### Development

To run the application in development mode with hot reloading:

```bash
npm run docker:dev
# or
docker-compose -f docker-compose.dev.yml up --build
```

This will start:
- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:8001 (with nodemon)
- Database: localhost:5432

## 📋 Available Commands

### Start/Stop Services
```bash
npm run docker:prod              # Start production environment
npm run docker:dev               # Start development environment
npm run docker:stop              # Stop production containers
npm run docker:stop:dev          # Stop development containers
```

### View Logs
```bash
npm run docker:logs              # View production logs
npm run docker:logs:dev          # View development logs
```

### Cleanup
```bash
npm run docker:clean             # Clean up production containers and volumes
npm run docker:clean:dev         # Clean up development containers and volumes
```

### Rebuild
```bash
npm run docker:rebuild           # Rebuild production containers
npm run docker:rebuild:dev       # Rebuild development containers
```

### Container Shell Access
```bash
npm run docker:shell:frontend    # Access production frontend shell
npm run docker:shell:backend     # Access production backend shell
npm run docker:shell:db          # Access production database
npm run docker:shell:frontend:dev # Access development frontend shell
npm run docker:shell:backend:dev  # Access development backend shell
npm run docker:shell:db:dev       # Access development database
```

### Other Commands
```bash
npm run docker:restart           # Restart production containers
npm run docker:restart:dev       # Restart development containers
npm run docker:status            # Check production container status
npm run docker:status:dev        # Check development container status
```

## 🌐 EC2 Deployment

For EC2 deployment, use the provided deployment script:

```bash
./deploy.sh
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed EC2 deployment instructions.

## 🗄️ Database

The PostgreSQL database data is persisted in a Docker volume named `postgres_data`. The database will be automatically created with the configured credentials.

## 🌐 Network

All services are connected through the `register_app_network` bridge network for secure communication.

## 🔧 Features

- **Patient Management**: Create, read, update, delete patients
- **Surgery Records**: Manage surgery records with file uploads
- **File Storage**: AWS S3 integration for secure file storage
- **Authentication**: JWT-based authentication system
- **Backup System**: Automated daily backups to S3
- **API Proxy**: Secure S3 file access through API proxy
- **Production Ready**: Nginx reverse proxy with security headers
- **Development Mode**: Hot reloading for both frontend and backend

## 📁 Project Structure

```
register_app/
├── api/                    # Backend API (Node.js/Express)
│   ├── config/            # Database and connection config
│   ├── global/            # Global middleware and utilities
│   ├── jobs/              # Background jobs (backup, scheduler)
│   ├── models/            # Sequelize models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── app.js            # Main application file
├── webapp/                # Frontend (Vue.js)
│   ├── src/
│   │   ├── components/    # Vue components
│   │   ├── services/      # API services
│   │   └── router/        # Vue router
│   └── Dockerfile         # Frontend container
├── docker-compose.yml     # Development environment
├── docker-compose.prod.yml # Production environment
├── docker-compose.dev.yml # Development environment
└── deploy.sh             # EC2 deployment script
```
