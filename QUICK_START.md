# 🚀 Quick Start Guide

Get your Register App running in minutes!

## Prerequisites

- Docker and Docker Compose installed
- AWS S3 bucket (for file storage)
- AWS credentials with S3 access

## 1. Clone and Setup

```bash
git clone <your-repo-url>
cd register_app
chmod +x deploy.sh
```

## 2. Configure Environment

```bash
# Copy the environment template
cp env.production.example .env.production

# Edit with your values
nano .env.production
```

**Required variables to update:**
- `POSTGRES_PASSWORD` - Choose a secure password
- `JWT_SECRET` - Generate a random secret
- `AWS_ACCESS_KEY` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `AWS_BUCKET_NAME` - Your S3 bucket name
- `VITE_API_BASE_URL` - Your server IP/domain

## 3. Run the Application

### For Production:
```bash
npm run docker:prod
```

### For Development:
```bash
npm run docker:dev
```

## 4. Access the Application

- **Frontend**: http://localhost (or your server IP)
- **Backend API**: http://localhost:8001
- **Health Check**: http://localhost/health

## 5. Default Login

The application creates default users on first run:
- **Admin**: Use the value from `DEFAULT_USER_ACCESS` (default: "admin")
- **User**: Use the value from `DEFAULT_USER_2` (default: "user")

## 🐳 Docker Commands

```bash
# Start services
npm run docker:prod

# View logs
npm run docker:logs

# Stop services
npm run docker:stop

# Restart services
npm run docker:restart

# Check status
npm run docker:status
```

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :80

# Stop conflicting services
sudo systemctl stop apache2  # if using Apache
sudo systemctl stop nginx    # if using Nginx
```

### Docker Permission Issues
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or run:
newgrp docker
```

### Database Connection Issues
```bash
# Check database container
docker-compose -f docker-compose.prod.yml logs db

# Restart database
docker-compose -f docker-compose.prod.yml restart db
```

## 📋 Next Steps

1. **Test the application** - Create a patient and surgery record
2. **Configure backups** - Verify S3 backup functionality
3. **Set up monitoring** - Monitor logs and performance
4. **Secure the deployment** - Set up SSL and firewall rules

## 🆘 Need Help?

- Check the logs: `npm run docker:logs`
- Review the full documentation in `README.md`
- Check the deployment guide in `DEPLOYMENT.md` 