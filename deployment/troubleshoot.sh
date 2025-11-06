#!/bin/bash

echo "========================================"
echo "Docker Troubleshooting Diagnostic Script"
echo "========================================"
echo ""

echo "1. Container Status:"
echo "-------------------"
docker compose ps
echo ""

echo "2. Backend Logs (last 50 lines):"
echo "--------------------------------"
docker compose logs --tail=50 backend
echo ""

echo "3. Frontend Logs (last 50 lines):"
echo "---------------------------------"
docker compose logs --tail=50 frontend
echo ""

echo "4. Database Status:"
echo "------------------"
docker compose exec postgres pg_isready -U postgres
echo ""

echo "5. Environment Variables Check:"
echo "------------------------------"
if [ -f .env ]; then
    echo "✓ .env file exists"
    echo "Checking required variables..."
    
    if grep -q "JWT_ACCESS_SECRET=" .env && ! grep -q "JWT_ACCESS_SECRET=$" .env; then
        echo "✓ JWT_ACCESS_SECRET is set"
    else
        echo "✗ JWT_ACCESS_SECRET is missing or empty"
    fi
    
    if grep -q "JWT_REFRESH_SECRET=" .env && ! grep -q "JWT_REFRESH_SECRET=$" .env; then
        echo "✓ JWT_REFRESH_SECRET is set"
    else
        echo "✗ JWT_REFRESH_SECRET is missing or empty"
    fi
    
    if grep -q "POSTGRES_PASSWORD=" .env; then
        echo "✓ POSTGRES_PASSWORD is set"
    else
        echo "✗ POSTGRES_PASSWORD is missing"
    fi
else
    echo "✗ .env file not found!"
fi
echo ""

echo "6. Network Status:"
echo "-----------------"
docker network ls | grep fashion
echo ""

echo "7. Volume Status:"
echo "----------------"
docker volume ls | grep fashion
echo ""

echo "========================================"
echo "Common Issues & Solutions:"
echo "========================================"
echo ""
echo "If Backend keeps restarting:"
echo "  - Check DATABASE_URL is correct"
echo "  - Ensure JWT secrets are set in .env"
echo "  - Run: docker compose logs backend"
echo ""
echo "If Frontend keeps restarting:"
echo "  - Check nginx configuration"
echo "  - Run: docker compose logs frontend"
echo ""
echo "To restart all services:"
echo "  docker compose down && docker compose up -d"
echo ""
