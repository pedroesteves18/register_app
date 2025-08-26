# 🚀 EC2 Deployment Guide

## 📋 Prerequisites

### AWS Requirements:
- AWS Account with EC2 access
- S3 bucket for file storage
- IAM user with S3 and EC2 permissions
- Domain name (optional but recommended)

### EC2 Instance Requirements:
- **Instance Type**: t3.medium or larger (2 vCPU, 4GB RAM minimum)
- **OS**: Ubuntu 22.04 LTS
- **Storage**: 20GB minimum (SSD recommended)
- **Security Groups**: Open ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

## 🔧 Step-by-Step Deployment

### 1. Launch EC2 Instance

1. **Go to AWS Console** → EC2 → Launch Instance
2. **Choose AMI**: Ubuntu Server 22.04 LTS
3. **Instance Type**: t3.medium (or larger)
4. **Configure Security Groups**:
   ```
   SSH (22) - Your IP
   HTTP (80) - 0.0.0.0/0
   HTTPS (443) - 0.0.0.0/0
   Custom TCP (8001) - 0.0.0.0/0 (for API)
   ```
5. **Launch and download key pair**

### 2. Connect to EC2 Instance

```bash
# Connect via SSH
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update system
sudo apt update && sudo apt upgrade -y
```

### 3. Clone and Setup Project

```bash
# Install Git
sudo apt install git -y

# Clone your repository
git clone https://github.com/your-username/register_app.git
cd register_app

# Make deployment script executable
chmod +x deploy.sh
```

### 4. Configure Environment Variables

```bash
# Create production environment file
cp .env.production.example .env.production

# Edit the file with your values
nano .env.production
```

**Required Environment Variables:**
```env
# Database Configuration
DB_NAME=register_app
DB_USER=postgres
DB_PASSWORD=your_secure_password_here

# Server Configuration
PORT=8001
JWT_SECRET=your_very_secure_jwt_secret_here

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
VITE_API_BASE_URL=http://your-ec2-public-ip:8001
```

### 5. Run Deployment Script

```bash
# Run the deployment script
./deploy.sh
```

The script will:
- Install Docker and Docker Compose
- Create necessary directories
- Build and start containers
- Show deployment status

### 6. Verify Deployment

```bash
# Check if containers are running
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Test health endpoint
curl http://localhost/health
```

## 🔒 Security Configuration

### 1. Configure Firewall (UFW)

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable
```

### 2. Set Up SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Configure Domain DNS

1. **Go to your domain registrar**
2. **Add A record**: `your-domain.com` → `your-ec2-public-ip`
3. **Add A record**: `www.your-domain.com` → `your-ec2-public-ip`

## 📊 Monitoring and Maintenance

### 1. View Application Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### 2. Backup Management

```bash
# Check backup status
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8001/api/backup/status

# Manual backup trigger
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8001/api/backup/trigger
```

### 3. Update Application

```bash
# Pull latest changes
git pull origin main

# Redeploy
./deploy.sh
```

### 4. System Monitoring

```bash
# Check system resources
htop

# Check disk usage
df -h

# Check Docker resources
docker system df
```

## 🚨 Troubleshooting

### Common Issues:

#### 1. Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :80

# Kill process if needed
sudo kill -9 PID
```

#### 2. Docker Permission Issues
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
exit
# SSH back in
```

#### 3. Database Connection Issues
```bash
# Check database container
docker-compose -f docker-compose.prod.yml logs postgres

# Restart database
docker-compose -f docker-compose.prod.yml restart postgres
```

#### 4. S3 Permission Issues
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check S3 bucket permissions
aws s3 ls s3://your-bucket-name
```

## 📈 Performance Optimization

### 1. Enable Swap (if needed)

```bash
# Create swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Optimize Nginx

```bash
# Edit nginx configuration
sudo nano /etc/nginx/nginx.conf

# Restart nginx
sudo systemctl restart nginx
```

### 3. Database Optimization

```bash
# Connect to database
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d register_app

# Check slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

## 🔄 Backup and Recovery

### 1. Database Backup

```bash
# Manual database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres register_app > backup.sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres register_app < backup.sql
```

### 2. Application Backup

```bash
# Backup application files
tar -czf app-backup-$(date +%Y%m%d).tar.gz .

# Backup Docker volumes
docker run --rm -v register_app_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup-$(date +%Y%m%d).tar.gz -C /data .
```

## 📞 Support

If you encounter issues:

1. **Check logs**: `docker-compose -f docker-compose.prod.yml logs`
2. **Verify configuration**: Check `.env.production` file
3. **Test connectivity**: Use `curl` to test endpoints
4. **Monitor resources**: Use `htop` and `df -h`

## 🎯 Next Steps

After successful deployment:

1. ✅ Set up monitoring (CloudWatch, DataDog, etc.)
2. ✅ Configure automated backups
3. ✅ Set up CI/CD pipeline
4. ✅ Implement logging aggregation
5. ✅ Set up alerting
6. ✅ Configure auto-scaling (if needed)

---

**Happy Deploying! 🚀** 