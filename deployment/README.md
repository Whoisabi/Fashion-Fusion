# Docker Deployment Guide

This directory contains Docker configuration for deploying the Fashion E-commerce application as microservices.

## Architecture

The application is split into three microservices:

1. **Frontend (Nginx)** - Serves the React application on port 80
2. **Backend (Node.js/Express)** - API server running on port 3000
3. **Database (PostgreSQL)** - Database server on port 5432

## Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 2.0+)
- At least 2GB of available RAM

## Quick Start

### 1. Generate JWT Secrets

First, generate secure random strings for JWT tokens:

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use Node.js (works on all platforms)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Generate two different secrets - one for `JWT_ACCESS_SECRET` and one for `JWT_REFRESH_SECRET`.

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and replace the placeholder values:

```env
# Database password (change this!)
POSTGRES_PASSWORD=your_secure_password_here

# JWT Secrets (use the generated values from step 1)
JWT_ACCESS_SECRET=your_generated_access_secret_here
JWT_REFRESH_SECRET=your_generated_refresh_secret_here

# Cloudinary (optional - only if you want image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Build and Run

Build and start all services:

```bash
docker-compose up --build
```

Or run in detached mode (background):

```bash
docker-compose up --build -d
```

### 4. Run Database Migrations

Once the backend is running, apply database migrations:

```bash
docker-compose exec backend npm run db:push
```

### 5. Access the Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes (WARNING: Deletes all data!)

```bash
docker-compose down -v
```

### Rebuild a Specific Service

```bash
docker-compose up --build backend
```

### Access Backend Container Shell

```bash
docker-compose exec backend sh
```

### Access Database

```bash
docker-compose exec postgres psql -U postgres -d fashion_db
```

## Troubleshooting

### Backend Won't Start

1. Check if database is healthy:
   ```bash
   docker-compose ps
   ```

2. View backend logs:
   ```bash
   docker-compose logs backend
   ```

3. Ensure environment variables are set correctly in `.env`

### Database Connection Issues

1. Verify DATABASE_URL format:
   ```
   postgresql://postgres:your_password@postgres:5432/fashion_db
   ```

2. Check if postgres service is running:
   ```bash
   docker-compose ps postgres
   ```

3. Test database connection:
   ```bash
   docker-compose exec postgres pg_isready -U postgres
   ```

### Frontend Can't Connect to Backend

1. Check nginx configuration in `deployment/frontend/nginx.conf`
2. Ensure backend is running and healthy
3. Check browser console for CORS errors

### Port Already in Use

If you get port conflicts, you can change the exposed ports in `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8080:80"  # Change 80 to 8080

backend:
  ports:
    - "4000:3000"  # Change 3000 to 4000
```

## Production Deployment

For production deployment:

1. **Use Strong Secrets**: Generate cryptographically secure JWT secrets and database passwords
2. **Enable HTTPS**: Use a reverse proxy like Traefik or configure Nginx with SSL certificates
3. **Database Backups**: Set up automated PostgreSQL backups
4. **Resource Limits**: Add resource limits in docker-compose.yml:
   ```yaml
   backend:
     deploy:
       resources:
         limits:
           cpus: '1'
           memory: 1G
   ```
5. **Environment Variables**: Never commit `.env` file to version control
6. **Health Checks**: Monitor service health endpoints
7. **Logging**: Configure centralized logging (ELK stack, CloudWatch, etc.)
8. **Scaling**: Use Docker Swarm or Kubernetes for horizontal scaling

## Environment Variables Reference

### Backend (.env)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_ACCESS_SECRET` | Yes | Secret for access tokens | Random 32+ char string |
| `JWT_REFRESH_SECRET` | Yes | Secret for refresh tokens | Random 32+ char string |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret | `abcdefghijklmnop` |
| `PORT` | No | Backend port (default: 3000) | `3000` |
| `NODE_ENV` | No | Node environment | `production` |

### Database

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Yes | Database password | `postgres123` |
| `POSTGRES_USER` | No | Database user | `postgres` |
| `POSTGRES_DB` | No | Database name | `fashion_db` |

## Support

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Verify environment variables are set correctly
3. Ensure all services are healthy: `docker-compose ps`
