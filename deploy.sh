#!/bin/bash

# ========================================
# EC2 DEPLOYMENT SCRIPT
# ========================================

set -e  # Exit on any error

echo "🚀 Starting EC2 deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
if [ ! -f .env.production ]; then
    print_error ".env.production file not found!"
    print_status "Please create .env.production file with your production configuration"
    exit 1
fi

# Load environment variables
print_status "Loading environment variables..."
source .env.production

# Update system packages
print_status "Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    sudo systemctl enable docker
    sudo systemctl start docker
    print_success "Docker installed successfully"
else
    print_status "Docker already installed"
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully"
else
    print_status "Docker Compose already installed"
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p backups
mkdir -p logs

# Set proper permissions
print_status "Setting proper permissions..."
sudo chown -R $USER:$USER backups
sudo chown -R $USER:$USER logs

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Remove old images
print_status "Cleaning up old images..."
docker system prune -f

# Build and start containers
print_status "Building and starting containers..."
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
print_status "Checking service status..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    print_success "All services are running!"
else
    print_error "Some services failed to start"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Show service status
print_status "Service status:"
docker-compose -f docker-compose.prod.yml ps

# Show logs
print_status "Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20

# Get EC2 public IP
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
if [ -z "$EC2_IP" ]; then
    EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4)
fi

print_success "Deployment completed successfully!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://$EC2_IP"
echo "   Backend API: http://$EC2_IP:8001"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "   Update application: ./deploy.sh"
echo ""
print_warning "Don't forget to:"
echo "   1. Configure your domain DNS to point to $EC2_IP"
echo "   2. Set up SSL certificates for HTTPS"
echo "   3. Configure firewall rules"
echo "   4. Set up monitoring and logging" 