# 🧪 Local Testing Guide

This guide shows you how to test the Register App locally before deploying to EC2.

## 🚀 Quick Start

### 1. Start Development Environment

```bash
# Start all services in development mode
npm run docker:dev

# Or manually
docker compose -f docker-compose.dev.yml up --build -d
```

### 2. Check Services Status

```bash
# View running containers
docker compose -f docker-compose.dev.yml ps

# View logs
docker compose -f docker-compose.dev.yml logs -f
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8001
- **Database**: localhost:5432

## 🔐 Authentication Testing

### Default Login Credentials

The application creates default users on startup. Check the environment variables:

```bash
docker compose -f docker-compose.dev.yml exec backend env | grep DEFAULT_USER
```

**Example output:**
```
DEFAULT_USER_ACCESS=bkl2118
DEFAULT_USER_2=cleibe2025
```

### Test Login API

```bash
# Test admin login
curl -X POST http://localhost:8001/users/login \
  -H "Content-Type: application/json" \
  -d '{"access": "bkl2118"}'

# Test user login
curl -X POST http://localhost:8001/users/login \
  -H "Content-Type: application/json" \
  -d '{"access": "cleibe2025"}'
```

**Expected response:**
```json
{
  "message": "Login successful",
  "userId": 1,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 📊 API Testing

### 1. Get Authentication Token

```bash
# Login and save token
TOKEN=$(curl -s -X POST http://localhost:8001/users/login \
  -H "Content-Type: application/json" \
  -d '{"access": "bkl2118"}' | jq -r '.token')

echo "Token: $TOKEN"
```

### 2. Test Patient Endpoints

```bash
# Get all patients
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/pacientes/all

# Create a patient
curl -X POST http://localhost:8001/pacientes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "dot": "1990-05-15",
    "sexo": "masc",
    "hospital": "Hospital Central",
    "registro": "HC12345",
    "historico": "Paciente com histórico de cirurgias"
  }'

# Get specific patient (replace 1 with actual patient ID)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/pacientes/1
```

### 3. Test Surgery Endpoints

```bash
# Get all surgeries
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/cirurgias/all

# Create a surgery (replace 1 with actual patient ID)
curl -X POST http://localhost:8001/cirurgias/1 \
  -H "Authorization: Bearer $TOKEN" \
  -F "data=2024-01-15" \
  -F "descrição=Cirurgia de apendicite" \
  -F "fotos=@/path/to/image.jpg"

# Get surgeries for a patient
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/cirurgias/paciente/1
```

### 4. Test Backup Endpoints

```bash
# Get backup status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/api/backup/status

# Trigger manual backup
curl -X POST http://localhost:8001/api/backup/trigger \
  -H "Authorization: Bearer $TOKEN"
```

## 🌐 Frontend Testing

### 1. Open Browser

Navigate to http://localhost:5173

### 2. Test User Interface

1. **Login**: Use the default access codes from environment variables
2. **Create Patient**: Add a new patient record
3. **Create Surgery**: Add surgery records with photos
4. **View Records**: Browse patients and surgeries
5. **Edit/Delete**: Test CRUD operations

### 3. Test File Upload

1. Create a surgery record
2. Upload image files
3. Verify images are displayed correctly
4. Test image proxy functionality

## 🗄️ Database Testing

### 1. Connect to Database

```bash
# Access PostgreSQL container
docker compose -f docker-compose.dev.yml exec db psql -U postgres -d register_app

# Or connect from host
psql -h localhost -p 5432 -U postgres -d register_app
```

### 2. Check Tables

```sql
-- List all tables
\dt

-- Check Users table
SELECT * FROM "Users";

-- Check Patients table
SELECT * FROM "Pacientes";

-- Check Surgeries table
SELECT * FROM "Cirurgia";
```

### 3. Test Data Integrity

```sql
-- Check foreign key relationships
SELECT p.nome, c."descrição", c.data 
FROM "Pacientes" p 
JOIN "Cirurgia" c ON p.id = c."pacienteId";
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :5173
sudo netstat -tulpn | grep :8001

# Stop conflicting services
sudo systemctl stop apache2
sudo systemctl stop nginx
```

#### 2. Docker Permission Issues
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or run:
newgrp docker
```

#### 3. Database Connection Issues
```bash
# Check database logs
docker compose -f docker-compose.dev.yml logs db

# Restart database
docker compose -f docker-compose.dev.yml restart db
```

#### 4. Frontend Not Loading
```bash
# Check frontend logs
docker compose -f docker-compose.dev.yml logs frontend

# Rebuild frontend
docker compose -f docker-compose.dev.yml build frontend
```

### Reset Everything

```bash
# Stop and remove all containers
docker compose -f docker-compose.dev.yml down -v

# Remove all images
docker system prune -a

# Start fresh
docker compose -f docker-compose.dev.yml up --build -d
```

## 📋 Testing Checklist

- [ ] **Backend API**: All endpoints responding
- [ ] **Authentication**: Login working with default credentials
- [ ] **Database**: Tables created and accessible
- [ ] **Frontend**: Vue.js app loading correctly
- [ ] **File Upload**: Images uploading to S3 (or local storage)
- [ ] **CRUD Operations**: Create, read, update, delete working
- [ ] **Backup System**: Manual backup trigger working
- [ ] **Error Handling**: Proper error messages displayed
- [ ] **Responsive Design**: UI working on different screen sizes

## 🚀 Next Steps

After successful local testing:

1. **Update Environment Variables**: Set production values
2. **Test Production Build**: Run `npm run docker:prod`
3. **Deploy to EC2**: Use `./deploy.sh`
4. **Monitor Logs**: Check application performance
5. **Set Up Monitoring**: Configure alerts and logging

## 📞 Need Help?

- Check logs: `docker compose -f docker-compose.dev.yml logs -f`
- Review documentation in `README.md`
- Check the deployment guide in `DEPLOYMENT.md` 