# Fashion E-commerce Docker Deployment Script for Windows PowerShell

Write-Host "🚀 Fashion E-commerce Docker Deployment Script" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host ""
    $create = Read-Host "Would you like to create a .env file now? (y/n)"
    
    if ($create -eq "y" -or $create -eq "Y") {
        Write-Host ""
        Write-Host "Creating .env file from template..." -ForegroundColor Green
        Copy-Item ".env.example" ".env"
        
        Write-Host ""
        Write-Host "🔑 Generating JWT secrets..." -ForegroundColor Green
        $JWT_ACCESS_SECRET = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
        $JWT_REFRESH_SECRET = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
        
        (Get-Content ".env") -replace "JWT_ACCESS_SECRET=.*", "JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET" | Set-Content ".env"
        (Get-Content ".env") -replace "JWT_REFRESH_SECRET=.*", "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET" | Set-Content ".env"
        
        Write-Host "✅ Generated JWT secrets" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Please edit .env file to set:" -ForegroundColor Yellow
        Write-Host "   - POSTGRES_PASSWORD (default: postgres123)"
        Write-Host "   - CLOUDINARY credentials (if using image uploads)"
        Write-Host ""
        Read-Host "Press Enter when you're ready to continue"
    } else {
        Write-Host "❌ Deployment cancelled. Please create .env file before deploying." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "1️⃣  Stopping existing containers..." -ForegroundColor Cyan
docker-compose down

Write-Host ""
Write-Host "2️⃣  Building Docker images..." -ForegroundColor Cyan
docker-compose build --no-cache

Write-Host ""
Write-Host "3️⃣  Starting services..." -ForegroundColor Cyan
docker-compose up -d

Write-Host ""
Write-Host "4️⃣  Waiting for database to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "5️⃣  Running database migrations..." -ForegroundColor Cyan
docker-compose exec -T backend npm run db:push

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "🌐 Access Points:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost"
Write-Host "   Backend:  http://localhost:3000"
Write-Host "   Database: localhost:5432"
Write-Host ""
Write-Host "📝 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs:        docker-compose logs -f"
Write-Host "   Stop services:    docker-compose down"
Write-Host "   Restart:          docker-compose restart"
Write-Host ""
