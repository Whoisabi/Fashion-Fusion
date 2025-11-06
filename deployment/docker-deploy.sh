#!/bin/bash

set -e

echo "🚀 Fashion E-commerce Docker Deployment Script"
echo "=============================================="

if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo ""
    read -p "Would you like to create a .env file now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Creating .env file from template..."
        cp .env.example .env
        
        echo ""
        echo "🔑 Generating JWT secrets..."
        JWT_ACCESS_SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
        JWT_REFRESH_SECRET=$(openssl rand -base64 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
        
        sed -i.bak "s|JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET|" .env
        sed -i.bak "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" .env
        rm -f .env.bak
        
        echo "✅ Generated JWT secrets"
        echo ""
        echo "📝 Please edit .env file to set:"
        echo "   - POSTGRES_PASSWORD (default: postgres123)"
        echo "   - CLOUDINARY credentials (if using image uploads)"
        echo ""
        read -p "Press Enter when you're ready to continue..."
    else
        echo "❌ Deployment cancelled. Please create .env file before deploying."
        exit 1
    fi
fi

echo ""
echo "1️⃣  Stopping existing containers..."
docker-compose down

echo ""
echo "2️⃣  Building Docker images..."
docker-compose build --no-cache

echo ""
echo "3️⃣  Starting services..."
docker-compose up -d

echo ""
echo "4️⃣  Waiting for database to be ready..."
sleep 10

echo ""
echo "5️⃣  Running database migrations..."
docker-compose exec -T backend npm run db:push

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Access Points:"
echo "   Frontend: http://localhost"
echo "   Backend:  http://localhost:3000"
echo "   Database: localhost:5432"
echo ""
echo "📝 Useful Commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop services:    docker-compose down"
echo "   Restart:          docker-compose restart"
echo ""
