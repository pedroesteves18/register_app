#!/bin/bash

echo "🚀 Starting Register App deployment..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "📦 Building and starting containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

echo "🔍 Checking service status..."
docker-compose ps

echo "✅ Deployment completed!"
echo "🌐 Frontend: http://localhost"
echo "🔧 Backend API: http://localhost:8001"
echo "🗄️  Database: localhost:5432"

echo ""
echo "📋 Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart" 