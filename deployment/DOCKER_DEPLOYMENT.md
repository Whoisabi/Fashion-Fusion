# Docker Deployment Guide for Fashion E-commerce

## What Was Fixed

The Docker deployment had several critical issues that have been resolved:

1. **Missing dev dependencies at runtime**: `tsx` and `drizzle-kit` are now included in the backend image for migrations and seeding
2. **Vite module not found**: The backend imports vite configuration; now all dependencies are included in backend container
3. **Correct separation of concerns**: Backend only builds/serves API; frontend container handles the React app
4. **Database connection issues**: Using `pg_isready` for reliable connection testing
5. **Missing postgresql-client**: Added `postgresql-client` to the Docker image for health checks
6. **Insufficient startup time**: Increased health check `start_period` from 40s to 90s
7. **Docker Compose warning**: Removed obsolete `version` field from docker-compose.yml

**Architecture**: 
- **Frontend container** (nginx on port 80): Builds the React app with Vite and serves static files
- **Backend container** (Node.js on port 3000): Serves the API only
- Nginx proxies `/api` and `/attached_assets` requests to the backend
- All dependencies (including dev deps) are kept in backend for migrations and seeding

## Prerequisites

- Docker and Docker Compose v2+ installed
- At least 2GB of free disk space
- Ports 80, 3000, and 5432 available

## Environment Variables

Create a `.env` file in the project root with these required variables:

```env
# PostgreSQL Database
POSTGRES_PASSWORD=your_secure_password_here

# JWT Secrets (required for authentication)
JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Cloudinary (optional - for image uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Important**: Generate secure random strings for JWT secrets:
```bash
# Generate secure secrets (Linux/Mac)
openssl rand -base64 32
```

## Deployment Steps

### 1. Clean Up Previous Containers (if any)

```bash
# Stop and remove existing containers
docker compose down -v

# Remove old images to rebuild fresh
docker rmi fashion-fusion-backend fashion-fusion-frontend 2>/dev/null || true
```

### 2. Build and Start Services

```bash
# Build and start all services
docker compose up -d --build

# Watch the logs to see progress
docker compose logs -f
```

### 3. Verify Deployment

Check that all services are healthy:

```bash
docker ps
```

You should see:
- `fashion_postgres` - Status: `healthy`
- `fashion_backend` - Status: `healthy` (may take up to 90 seconds)
- `fashion_frontend` - Status: `Up`

### 4. Access the Application

- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

## Troubleshooting

### Backend Container Shows "Unhealthy"

**Check the logs:**
```bash
docker compose logs backend
```

**Common issues:**
1. **JWT secrets not set**: Ensure `.env` file has `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
2. **Database migrations failed**: Check if database has proper permissions
3. **Port conflicts**: Ensure port 3000 is not in use by another service

### Backend Keeps Waiting for Database

**Fixed in the updated version**, but if you still see this:
```bash
# Rebuild the backend with the fixed entrypoint
docker compose up -d --build backend
```

### Database Connection Errors

```bash
# Check database logs
docker compose logs postgres

# Verify database is accessible
docker exec fashion_postgres pg_isready -U postgres
```

### Frontend Can't Connect to Backend

Make sure the backend is healthy first:
```bash
docker ps
# Wait until fashion_backend shows (healthy)
```

## Production Deployment

For production on AWS EC2, DigitalOcean, or similar:

### 1. Update Security Settings

```bash
# In docker-compose.yml, consider:
# - Removing port mappings for postgres (keep it internal)
# - Using Docker secrets instead of .env file
# - Setting up SSL/TLS with nginx or Traefik
```

### 2. Use Strong Passwords

```bash
# Generate strong passwords
openssl rand -base64 32
```

### 3. Set Up Reverse Proxy (Recommended)

Use nginx or Traefik to:
- Handle SSL/TLS certificates
- Rate limiting
- Load balancing
- Serve static files efficiently

### 4. Enable Docker Logging

```bash
# View production logs
docker compose logs -f --tail=100
```

### 5. Set Up Automated Backups

```bash
# Backup PostgreSQL data
docker exec fashion_postgres pg_dump -U postgres fashion_db > backup_$(date +%Y%m%d).sql

# Restore from backup
docker exec -i fashion_postgres psql -U postgres fashion_db < backup_20251106.sql
```

## Maintenance Commands

```bash
# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f backend

# Restart a service
docker compose restart backend

# Stop all services
docker compose down

# Stop and remove all data (WARNING: destroys database)
docker compose down -v

# Update and rebuild
git pull
docker compose up -d --build
```

## Notes

- The database automatically seeds with sample data on first run
- Auto-seeding is skipped if products already exist
- Migrations run automatically on container startup
- The backend waits up to 60 seconds for the database to be ready

## Support

If you encounter issues not covered in this guide:

1. Check container logs: `docker compose logs`
2. Verify environment variables are set correctly
3. Ensure all required ports are available
4. Try rebuilding from scratch: `docker compose down -v && docker compose up -d --build`
