# Docker Deployment - Quick Start Guide

This project is now configured for Docker deployment with separate frontend and backend microservices.

## 📁 Deployment Structure

```
deployment/
├── backend/
│   ├── Dockerfile           # Backend container configuration
│   └── .env.example        # Backend environment variables template
├── frontend/
│   ├── Dockerfile          # Frontend container configuration
│   ├── nginx.conf          # Nginx reverse proxy configuration
│   └── .env.example        # Frontend environment variables template
├── docker-deploy.sh        # Automated deployment script (Linux/Mac)
├── docker-deploy.ps1       # Automated deployment script (Windows)
└── README.md               # Comprehensive deployment guide

docker-compose.yml          # Orchestrates all microservices
.env.example                # Main environment variables template
.dockerignore              # Docker build optimization
```

## 🚀 Quick Deploy

### Option 1: Automated Deployment (Recommended)

**Linux/Mac:**
```bash
./deployment/docker-deploy.sh
```

**Windows PowerShell:**
```powershell
.\deployment\docker-deploy.ps1
```

The script will:
- ✅ Create .env file with auto-generated JWT secrets
- ✅ Build Docker images
- ✅ Start all services
- ✅ Run database migrations
- ✅ Show service status

### Option 2: Manual Deployment

1. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Generate JWT secrets:**
   ```bash
   # Linux/Mac
   openssl rand -base64 32
   
   # Windows PowerShell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   
   # Node.js (cross-platform)
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

3. **Edit .env file:**
   ```env
   POSTGRES_PASSWORD=your_secure_password
   JWT_ACCESS_SECRET=your_generated_access_secret
   JWT_REFRESH_SECRET=your_generated_refresh_secret
   ```

4. **Deploy:**
   ```bash
   docker-compose up --build -d
   docker-compose exec backend npm run db:push
   ```

## 🎯 Microservices Architecture

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 80 | React app served by Nginx |
| **Backend** | 3000 | Express API server |
| **Database** | 5432 | PostgreSQL database |

### Communication Flow

```
User Request
    ↓
Frontend (Nginx:80)
    ↓
/api/* → Backend (Express:3000)
    ↓
Database (PostgreSQL:5432)
```

## 📋 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Database password | `mySecurePass123` |
| `JWT_ACCESS_SECRET` | Access token secret | Generated 32+ char string |
| `JWT_REFRESH_SECRET` | Refresh token secret | Generated 32+ char string |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLOUDINARY_CLOUD_NAME` | Image upload service | _(empty)_ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | _(empty)_ |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | _(empty)_ |

## 🛠️ Common Commands

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Stop and remove all data (⚠️ WARNING: Deletes database!)
docker-compose down -v

# Access backend shell
docker-compose exec backend sh

# Access database
docker-compose exec postgres psql -U postgres -d fashion_db

# Check service health
docker-compose ps
```

## 🔍 Health Checks

The backend includes a health check endpoint:

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "database": "connected"
}
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Verify database is running
docker-compose ps postgres

# Restart backend
docker-compose restart backend
```

### Frontend can't connect to backend
```bash
# Check nginx configuration
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Verify backend is running
curl http://localhost:3000/api/health
```

### Database connection errors
```bash
# Test database connection
docker-compose exec postgres pg_isready -U postgres

# Check DATABASE_URL in backend
docker-compose exec backend env | grep DATABASE_URL
```

### Port conflicts
If ports 80, 3000, or 5432 are already in use, edit `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8080:80"  # Changed from 80

backend:
  ports:
    - "4000:3000"  # Changed from 3000
```

## 📚 Documentation

For detailed information, see:
- **[deployment/README.md](deployment/README.md)** - Complete deployment guide
- **Backend Dockerfile** - `deployment/backend/Dockerfile`
- **Frontend Dockerfile** - `deployment/frontend/Dockerfile`
- **Nginx Config** - `deployment/frontend/nginx.conf`

## 🔐 Security Notes

1. **Never commit .env file** - It contains secrets
2. **Use strong passwords** - Especially for production
3. **Rotate JWT secrets** - Change them periodically
4. **Enable HTTPS** - Use SSL certificates in production
5. **Backup database** - Set up automated PostgreSQL backups

## 📦 What's Included

✅ Multi-stage Docker builds for optimized images  
✅ Health checks for all services  
✅ Nginx reverse proxy with caching  
✅ PostgreSQL with persistent volumes  
✅ Automatic service dependencies  
✅ Environment-based configuration  
✅ Production-ready setup  
✅ Comprehensive error handling  

## 🎉 Access Your Application

After successful deployment:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

---

**Need help?** Check the detailed guide in `deployment/README.md`
